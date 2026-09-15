@echo off
echo Starting JA Assure AI Marketing Agent Backend...
cd /d "%~dp0\..\backend"
venv\Scripts\uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
