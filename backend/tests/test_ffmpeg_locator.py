"""
Tests for robust FFmpeg/ffprobe discovery (app/services/ffmpeg_locator.py).

Covers: normal PATH lookup, explicit *_PATH env var override (and that it's
validated, not trusted blindly), the Windows-only install-location fallback (using
a temp directory standing in for %LOCALAPPDATA%/WinGet's package store -- never a
real hard-coded path), and that a genuinely missing executable raises a clear,
actionable error rather than silently returning a placeholder.
"""
import os
import stat
import sys
from pathlib import Path

import pytest

from app.services.ffmpeg_locator import (
    resolve_ffmpeg,
    resolve_ffprobe,
    FFmpegNotFoundError,
    _is_executable_file,
    _windows_install_candidates,
)


def _make_fake_executable(path: Path) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("#!/bin/sh\necho fake\n", encoding="utf-8")
    path.chmod(path.stat().st_mode | stat.S_IEXEC | stat.S_IXGRP | stat.S_IXOTH)
    return path


# ---------------------------------------------------------------------------
# PATH discovery (shutil.which)
# ---------------------------------------------------------------------------

def test_path_discovery_used_when_shutil_which_finds_it(tmp_path, monkeypatch):
    fake_ffmpeg = _make_fake_executable(tmp_path / "ffmpeg_fake")
    monkeypatch.delenv("FFMPEG_PATH", raising=False)
    monkeypatch.setattr("app.services.ffmpeg_locator.shutil.which", lambda name: str(fake_ffmpeg))

    resolved = resolve_ffmpeg()

    assert resolved == str(fake_ffmpeg.resolve())


def test_path_discovery_ignored_when_which_returns_nonexistent_file(tmp_path, monkeypatch):
    """shutil.which() result is still validated -- a stale/broken PATH entry must not be trusted blindly."""
    monkeypatch.delenv("FFMPEG_PATH", raising=False)
    monkeypatch.setattr("app.services.ffmpeg_locator.shutil.which", lambda name: str(tmp_path / "does_not_exist"))
    monkeypatch.setattr("app.services.ffmpeg_locator._windows_install_candidates", lambda filename: [])

    with pytest.raises(FFmpegNotFoundError):
        resolve_ffmpeg()


# ---------------------------------------------------------------------------
# Configured FFMPEG_PATH / FFPROBE_PATH
# ---------------------------------------------------------------------------

def test_configured_ffmpeg_path_takes_priority_over_path_lookup(tmp_path, monkeypatch):
    configured = _make_fake_executable(tmp_path / "configured" / "ffmpeg_custom")
    on_path = _make_fake_executable(tmp_path / "on_path" / "ffmpeg_other")

    monkeypatch.setenv("FFMPEG_PATH", str(configured))
    monkeypatch.setattr("app.services.ffmpeg_locator.shutil.which", lambda name: str(on_path))

    resolved = resolve_ffmpeg()

    assert resolved == str(configured.resolve())


def test_configured_ffprobe_path_is_used(tmp_path, monkeypatch):
    configured = _make_fake_executable(tmp_path / "ffprobe_custom")
    monkeypatch.setenv("FFPROBE_PATH", str(configured))
    monkeypatch.setattr("app.services.ffmpeg_locator.shutil.which", lambda name: None)
    monkeypatch.setattr("app.services.ffmpeg_locator._windows_install_candidates", lambda filename: [])

    resolved = resolve_ffprobe()

    assert resolved == str(configured.resolve())


def test_configured_path_pointing_to_missing_file_falls_through_to_path_lookup(tmp_path, monkeypatch):
    """An invalid FFMPEG_PATH must not hard-fail immediately -- fall through and keep trying."""
    fallback = _make_fake_executable(tmp_path / "fallback_ffmpeg")
    monkeypatch.setenv("FFMPEG_PATH", str(tmp_path / "nonexistent_configured_path"))
    monkeypatch.setattr("app.services.ffmpeg_locator.shutil.which", lambda name: str(fallback))

    resolved = resolve_ffmpeg()

    assert resolved == str(fallback.resolve())


# ---------------------------------------------------------------------------
# Missing executable -> clear, actionable error (never a silent fake substitute)
# ---------------------------------------------------------------------------

def test_missing_executable_raises_actionable_error(monkeypatch):
    monkeypatch.delenv("FFMPEG_PATH", raising=False)
    monkeypatch.setattr("app.services.ffmpeg_locator.shutil.which", lambda name: None)
    monkeypatch.setattr("app.services.ffmpeg_locator._windows_install_candidates", lambda filename: [])

    with pytest.raises(FFmpegNotFoundError) as exc_info:
        resolve_ffmpeg()

    message = str(exc_info.value)
    assert "ffmpeg" in message
    assert "FFMPEG_PATH" in message  # tells the user exactly which env var fixes it
    assert "winget install Gyan.FFmpeg" in message  # actionable install instructions
    assert exc_info.value.checked  # records what was actually tried, for diagnosis


def test_missing_ffprobe_raises_with_its_own_env_var_name(monkeypatch):
    monkeypatch.delenv("FFPROBE_PATH", raising=False)
    monkeypatch.setattr("app.services.ffmpeg_locator.shutil.which", lambda name: None)
    monkeypatch.setattr("app.services.ffmpeg_locator._windows_install_candidates", lambda filename: [])

    with pytest.raises(FFmpegNotFoundError) as exc_info:
        resolve_ffprobe()

    assert "FFPROBE_PATH" in str(exc_info.value)


# ---------------------------------------------------------------------------
# Windows install-location fallback (the actual reported bug's fix)
# ---------------------------------------------------------------------------

def test_windows_candidates_discovers_wingetish_layout_without_hardcoded_username(tmp_path, monkeypatch):
    """
    Reproduces the real WinGet Gyan.FFmpeg install layout under a TEMP directory
    standing in for %LOCALAPPDATA% -- proves discovery works for ANY user/version
    without a single hard-coded path.
    """
    fake_local_app_data = tmp_path / "FakeLocalAppData"
    versioned_build_dir = (
        fake_local_app_data / "Microsoft" / "WinGet" / "Packages"
        / "Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe"
        / "ffmpeg-9.0.1-full_build" / "bin"
    )
    fake_ffmpeg_exe = _make_fake_executable(versioned_build_dir / "ffmpeg.exe")
    _make_fake_executable(versioned_build_dir / "ffprobe.exe")

    monkeypatch.setattr(os, "name", "nt")
    monkeypatch.setenv("LOCALAPPDATA", str(fake_local_app_data))

    candidates = _windows_install_candidates("ffmpeg.exe")

    assert str(fake_ffmpeg_exe.resolve()) in [str(Path(c).resolve()) for c in candidates]


def test_windows_candidates_survive_a_different_version_or_username(tmp_path, monkeypatch):
    """A different WinGet build-hash/version folder name must still be found -- nothing is hard-coded."""
    fake_local_app_data = tmp_path / "AnotherUsersAppData"
    different_build_dir = (
        fake_local_app_data / "Microsoft" / "WinGet" / "Packages"
        / "Gyan.FFmpeg_Microsoft.Winget.Source_totallydifferenthash"
        / "ffmpeg-99.9.9-full_build" / "bin"
    )
    fake_ffmpeg_exe = _make_fake_executable(different_build_dir / "ffmpeg.exe")

    monkeypatch.setattr(os, "name", "nt")
    monkeypatch.setenv("LOCALAPPDATA", str(fake_local_app_data))

    candidates = _windows_install_candidates("ffmpeg.exe")

    assert str(fake_ffmpeg_exe.resolve()) in [str(Path(c).resolve()) for c in candidates]


def test_windows_candidates_end_to_end_through_resolve_ffmpeg(tmp_path, monkeypatch):
    """The full resolve_ffmpeg() path: PATH lookup fails, Windows fallback succeeds."""
    fake_local_app_data = tmp_path / "FakeLocalAppData"
    build_dir = (
        fake_local_app_data / "Microsoft" / "WinGet" / "Packages"
        / "Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe"
        / "ffmpeg-9.0.1-full_build" / "bin"
    )
    fake_ffmpeg_exe = _make_fake_executable(build_dir / "ffmpeg.exe")

    monkeypatch.delenv("FFMPEG_PATH", raising=False)
    monkeypatch.setattr(os, "name", "nt")
    monkeypatch.setenv("LOCALAPPDATA", str(fake_local_app_data))
    monkeypatch.setattr("app.services.ffmpeg_locator.shutil.which", lambda name: None)

    resolved = resolve_ffmpeg()

    assert resolved == str(fake_ffmpeg_exe.resolve())


def test_windows_candidates_empty_on_non_windows(monkeypatch):
    monkeypatch.setattr(os, "name", "posix")
    assert _windows_install_candidates("ffmpeg") == []


def test_windows_candidates_never_reference_a_literal_hardcoded_username():
    """
    Static guard: the module's own source must not contain a literal
    "C:\\Users\\<name>" style path -- every root must come from an env var.
    """
    source = Path(__file__).resolve().parents[1] / "app" / "services" / "ffmpeg_locator.py"
    text = source.read_text(encoding="utf-8")
    assert "C:/Users/" not in text and "C:\\Users\\" not in text


# ---------------------------------------------------------------------------
# _is_executable_file
# ---------------------------------------------------------------------------

def test_is_executable_file_false_for_missing_path(tmp_path):
    assert _is_executable_file(str(tmp_path / "nope")) is False


def test_is_executable_file_false_for_none():
    assert _is_executable_file(None) is False


@pytest.mark.skipif(sys.platform == "win32", reason="POSIX exec bit isn't meaningful on Windows")
def test_is_executable_file_false_for_non_executable_regular_file(tmp_path):
    non_exec = tmp_path / "not_executable.txt"
    non_exec.write_text("just text", encoding="utf-8")
    non_exec.chmod(0o644)  # readable, not executable
    assert _is_executable_file(str(non_exec)) is False
