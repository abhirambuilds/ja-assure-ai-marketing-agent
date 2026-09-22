import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Send, 
  Copy, 
  ShieldCheck, 
  BrainCircuit, 
  Search, 
  Wand2,
  Volume2,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import type { GeneratedVariation, VideoScript, LessonLearned, Competitor, VoiceGenerationResponse } from '../../types';
import { api, getMediaUrl } from '../../services/api';

interface ContentStudioViewProps {
  studioBrand: 'jade' | 'doctorshield' | 'jaguartransit';
  setStudioBrand: (brand: 'jade' | 'doctorshield' | 'jaguartransit') => void;
  studioPlatform: string;
  setStudioPlatform: (platform: string) => void;
  studioLanguage: string;
  setStudioLanguage: (language: string) => void;
  studioTopic: string;
  setStudioTopic: (topic: string) => void;
  generatedVariations: GeneratedVariation[];
  videoScript: VideoScript | null;
  actionLoading: string | null;
  onGenerateVariations: () => void;
  onLaunchFullSuite: () => void;
  showToast: (msg: string) => void;
  lessons: LessonLearned[];
  competitors: Competitor[];
}

export const ContentStudioView: React.FC<ContentStudioViewProps> = ({
  studioBrand,
  setStudioBrand,
  studioPlatform,
  setStudioPlatform,
  studioLanguage,
  setStudioLanguage,
  studioTopic,
  setStudioTopic,
  generatedVariations,
  videoScript,
  actionLoading,
  onGenerateVariations,
  onLaunchFullSuite,
  showToast,
  lessons,
  competitors
}) => {
  const [selectedSubTab, setSelectedSubTab] = useState<'content' | 'compliance' | 'research' | 'lessons'>('content');
  const [voiceLoading, setVoiceLoading] = useState(false);
  const [voiceResult, setVoiceResult] = useState<VoiceGenerationResponse | null>(null);
  const [voiceError, setVoiceError] = useState<string | null>(null);

  // Reset voice state whenever a fresh video script is produced
  useEffect(() => {
    setVoiceResult(null);
    setVoiceError(null);
  }, [videoScript]);

  const handleGenerateVoiceover = async () => {
    if (!videoScript) return;
    setVoiceLoading(true);
    setVoiceError(null);
    try {
      const res = await api.generateVoiceover(videoScript, studioLanguage);
      setVoiceResult(res);
      showToast('🔊 MP3 voiceover synthesized with gTTS and ready to play!');
    } catch (err: any) {
      console.error(err);
      const msg = err.message || 'Voiceover synthesis failed.';
      setVoiceError(msg);
      showToast(`✕ Voiceover generation failed: ${msg}`);
    } finally {
      setVoiceLoading(false);
    }
  };

  const isGenerating = actionLoading === 'generating';
  const isExecutingSuite = actionLoading === 'suite';
  const isVideoMode = studioPlatform === 'reel' || studioPlatform === 'video';

  // Count relevant active lessons for this brand
  const activeBrandLessons = lessons.filter(l => l.active);
  const brandCompetitors = competitors;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* LEFT COLUMN (4 Cols): Campaign Configuration */}
      <div className="lg:col-span-4 space-y-5">
        <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Campaign Configuration
            </h3>
            <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded font-medium">
              Parameters
            </span>
          </div>

          <div className="space-y-3.5 text-xs">
            {/* Brand Persona Selector */}
            <div>
              <label className="text-slate-700 font-semibold block">Brand Persona</label>
              <select
                value={studioBrand}
                onChange={(e) => setStudioBrand(e.target.value as any)}
                className="w-full mt-1.5 bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer font-medium"
              >
                <option value="jade">Jade (Luxury Jewellery & Private Wealth)</option>
                <option value="doctorshield">DoctorShield (Medical Professional Indemnity)</option>
                <option value="jaguartransit">Jaguar Transit (High-Risk Cargo & Transit)</option>
              </select>
            </div>

            {/* Target Platform */}
            <div>
              <label className="text-slate-700 font-semibold block">Distribution Channel / Format</label>
              <select
                value={studioPlatform}
                onChange={(e) => setStudioPlatform(e.target.value)}
                className="w-full mt-1.5 bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer font-medium"
              >
                <option value="linkedin">LinkedIn Post (Executive / Risk Advisory)</option>
                <option value="instagram">Instagram Caption (Visual Storytelling)</option>
                <option value="reel">Instagram / TikTok Reel (45s Production Storyboard)</option>
                <option value="video">Explainer Video Script (60s Multi-Scene Storyboard)</option>
                <option value="blog">InsurTech Editorial / Thought Leadership</option>
                <option value="email">VIP Underwriting Newsletter / Broker Note</option>
              </select>
            </div>

            {/* Language Localization */}
            <div>
              <label className="text-slate-700 font-semibold block">Regional Localization</label>
              <select
                value={studioLanguage}
                onChange={(e) => setStudioLanguage(e.target.value)}
                className="w-full mt-1.5 bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="en">English (Singapore / International)</option>
                <option value="ms">Bahasa Melayu (Malaysia & Brunei)</option>
                <option value="id">Bahasa Indonesia (Jakarta / SEA)</option>
                <option value="th">Thai (ภาษาไทย - Bangkok)</option>
                <option value="zh">Chinese (Simplified / 简体中文)</option>
              </select>
            </div>

            {/* Campaign Topic & Brief */}
            <div>
              <label className="text-slate-700 font-semibold block">Campaign Brief & Problem Angle</label>
              <textarea
                rows={4}
                value={studioTopic}
                onChange={(e) => setStudioTopic(e.target.value)}
                className="w-full mt-1.5 bg-white border border-slate-300 rounded-lg p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
                placeholder="Describe the coverage problem, target demographic, or insurance vulnerability..."
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-2 space-y-2">
              <button
                onClick={onGenerateVariations}
                disabled={isGenerating || isExecutingSuite}
                className="ja-btn-gold w-full py-2.5 rounded-lg text-slate-900 font-bold text-xs flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5 text-slate-900" />
                {isGenerating ? 'Synthesizing with Groq...' : isVideoMode ? 'Generate AI Video Storyboard' : 'Generate A/B Variations'}
              </button>

              <button
                onClick={onLaunchFullSuite}
                disabled={isGenerating || isExecutingSuite}
                className="w-full py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs border border-slate-300 flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5 text-blue-600" />
                {isExecutingSuite ? 'Executing Full Brain Suite...' : 'Execute Full Pipeline Suite'}
              </button>
            </div>
          </div>
        </div>

        {/* Brand Persona Guide Mini-Card */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 text-xs space-y-2 shadow-2xs">
          <span className="text-[10px] font-semibold text-slate-500 uppercase block">Brand Persona Guardrails</span>
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
            <span className="font-semibold text-slate-800">
              {studioBrand === 'jade' ? 'Jade: Luxury, Discretion & Preservation' :
               studioBrand === 'doctorshield' ? 'DoctorShield: Clinical Rigor & Defensibility' :
               'Jaguar Transit: Velocity, Chain-of-Custody & Resilience'}
            </span>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              {studioBrand === 'jade' 
                ? 'Emphasizes bespoke private vault protection, agreed-value valuation, and discreet worldwide collector coverage.'
                : studioBrand === 'doctorshield'
                ? 'Addresses surgical dispute defense, SMC inquiry coverage, and statutory indemnity limits without diagnostic claims.'
                : 'Focuses on secured armored transit, port-to-port diamond logistics, and high-value cargo casualty guarantees.'}
            </p>
          </div>
        </div>
      </div>

      {/* CENTER COLUMN (5 Cols): AI Generation Workspace */}
      <div className="lg:col-span-5 space-y-4">
        {/* Workspace Detail Sub-tabs */}
        <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2.5 overflow-x-auto">
          {[
            { id: 'content', label: 'Generated Copy', icon: Sparkles },
            { id: 'compliance', label: 'Regulatory Audit', icon: ShieldCheck },
            { id: 'research', label: 'Market Context', icon: Search },
            { id: 'lessons', label: 'Injected Lessons', icon: BrainCircuit }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = selectedSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedSubTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                  isActive 
                    ? 'bg-white text-[#0c2340] border border-slate-300 font-bold shadow-2xs' 
                    : 'text-slate-600 hover:text-slate-900 bg-slate-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Sub-tab 1: CONTENT (A/B Variations or Video Storyboard) */}
        {selectedSubTab === 'content' && (
          <div className="space-y-4">
            {isGenerating && (
              <div className="bg-white p-10 rounded-xl border border-amber-300 text-center space-y-3 animate-pulse shadow-2xs">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto">
                  <Sparkles className="w-5 h-5 animate-spin text-amber-600" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">Synthesizing Persona Copy with Groq LLaMA 3.3</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Querying database lessons learned, filtering competitor positioning, and running deterministic MAS/MOH compliance check...
                </p>
              </div>
            )}

            {/* Video / Reels Storyboard Cue Sheet */}
            {!isGenerating && videoScript && (
              <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4 shadow-2xs">
                <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 uppercase">
                      AI-Generated Storyboard
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 mt-1">{videoScript.title || videoScript.concept}</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Target Duration: <span className="text-slate-800 font-medium">{videoScript.target_duration_seconds}s</span> • 
                      Format: <span className="text-slate-800 font-medium capitalize">{videoScript.target_platform || studioPlatform}</span> • 
                      Tone: <span className="text-slate-800 capitalize">{videoScript.voiceover_tone}</span>
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(videoScript, null, 2));
                      showToast('Storyboard JSON copied to clipboard!');
                    }}
                    className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 bg-slate-100 border border-slate-200 cursor-pointer"
                    title="Copy Cue Sheet"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>

                {videoScript.hook && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-950 font-sans">
                    <span className="font-bold text-blue-800 uppercase mr-2">Opening Hook:</span>
                    "{videoScript.hook}"
                  </div>
                )}

                {/* Voiceover Speech Studio Panel */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-blue-100 border border-blue-200 flex items-center justify-center">
                        <Volume2 className="w-4 h-4 text-blue-700" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                          Voice Agent & Audio Synthesis
                          {voiceResult ? (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Voiceover Ready
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                              gTTS Engine
                            </span>
                          )}
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          Synthesizes scene voiceovers into a single continuous MP3 audio track in {studioLanguage.toUpperCase()}
                        </p>
                      </div>
                    </div>

                    {!voiceResult && (
                      <button
                        onClick={handleGenerateVoiceover}
                        disabled={voiceLoading}
                        className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer w-fit"
                      >
                        {voiceLoading ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            Generating Voiceover...
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3.5 h-3.5" />
                            Generate Voiceover
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {voiceLoading && (
                    <div className="py-3 text-center text-xs text-blue-800 flex items-center justify-center gap-2 bg-blue-50 rounded-lg border border-blue-200 animate-pulse">
                      <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                      Synthesizing scene voiceover copy with gTTS ({studioLanguage.toUpperCase()})...
                    </div>
                  )}

                  {voiceError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>{voiceError}</span>
                      </div>
                      <button
                        onClick={handleGenerateVoiceover}
                        className="text-[11px] underline hover:text-rose-900 font-semibold cursor-pointer"
                      >
                        Retry
                      </button>
                    </div>
                  )}

                  {voiceResult && (
                    <div className="space-y-3 pt-1">
                      {/* Audio Metadata Chips */}
                      <div className="flex flex-wrap items-center gap-2 text-[11px]">
                        <span className="px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200">
                          Lang: <strong className="text-blue-700 uppercase">{voiceResult.language}</strong>
                        </span>
                        <span className="px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200">
                          Provider: <strong className="text-slate-900 capitalize">{voiceResult.provider}</strong>
                        </span>
                        {voiceResult.duration_seconds && (
                          <span className="px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200">
                            Duration: <strong className="text-emerald-700">{voiceResult.duration_seconds}s</strong>
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200">
                          Size: <strong className="text-slate-900">{(voiceResult.file_size_bytes / 1024).toFixed(1)} KB</strong>
                        </span>
                      </div>

                      {/* Real HTML5 Audio Player */}
                      <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                        <audio
                          key={voiceResult.audio_url}
                          controls
                          className="w-full h-10 rounded"
                        >
                          <source src={getMediaUrl(voiceResult.audio_url)} type="audio/mpeg" />
                          Your browser does not support the audio element.
                        </audio>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-1">
                        <span className="text-[10px] text-slate-500 truncate max-w-[280px]">
                          File: {voiceResult.audio_filename}
                        </span>
                        <div className="flex items-center gap-2">
                          <a
                            href={getMediaUrl(voiceResult.audio_url)}
                            download={voiceResult.audio_filename}
                            className="px-2.5 py-1 rounded-lg text-xs text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Download MP3
                          </a>
                          <button
                            onClick={handleGenerateVoiceover}
                            disabled={voiceLoading}
                            className="px-2.5 py-1 rounded-lg text-xs text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                            title="Regenerate speech audio"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            Re-synthesize
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Vertical Scene Timeline */}
                <div className="space-y-3 relative">
                  <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-slate-200" />
                  {videoScript.scenes.map((scene) => (
                    <div key={scene.scene_number} className="relative pl-8 text-xs space-y-1 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                      <div className="absolute left-2.5 top-4 w-3 h-3 rounded-full bg-blue-600 border-2 border-white -translate-x-1/2" />
                      
                      <div className="flex items-center justify-between text-slate-600 text-[11px]">
                        <span className="font-bold text-slate-900">Scene {scene.scene_number}</span>
                        <span className="text-blue-700 font-bold">{scene.duration_seconds}s</span>
                      </div>
                      <p><strong className="text-slate-700">Visual:</strong> {scene.visual_description}</p>
                      <p><strong className="text-slate-700">Voiceover:</strong> "{scene.voiceover}"</p>
                      <p className="text-blue-900 font-medium"><strong className="text-slate-700">On-Screen Text:</strong> [{scene.onscreen_text}]</p>
                      {scene.transition && (
                        <p className="text-slate-500 text-[10px]"><strong className="text-slate-600">Transition:</strong> {scene.transition}</p>
                      )}
                      {scene.compliance_disclaimer && (
                        <p className="text-amber-900 text-[10px] bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          <strong>Disclaimer Cue:</strong> {scene.compliance_disclaimer}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                <div className="text-[10px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  ℹ️ Production cue sheet format. Visual and audio directions are structured for video production.
                </div>
              </div>
            )}

            {/* Standard A/B Variations Display */}
            {!isGenerating && !videoScript && generatedVariations.length > 0 && (
              <div className="space-y-4">
                {generatedVariations.map((v) => (
                  <div key={v.variation_label} className="bg-white p-5 rounded-xl border border-slate-200 space-y-3 shadow-2xs">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200">
                        Variation {v.variation_label} • {v.variation_label === 'A' ? 'Professional / Risk Angle' : 'Emotional / Protection Angle'}
                      </span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(v.content_text);
                          showToast(`Variation ${v.variation_label} copied to clipboard!`);
                        }}
                        className="text-slate-500 hover:text-slate-800 p-1 rounded hover:bg-slate-100 cursor-pointer"
                        title="Copy Text"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {v.headline && (
                      <h4 className="font-bold text-slate-900 text-xs">{v.headline}</h4>
                    )}

                    <p className="text-xs text-slate-800 whitespace-pre-line leading-relaxed bg-slate-50 p-3.5 rounded-lg border border-slate-200 font-sans">
                      {v.content_text}
                    </p>

                    {v.hashtags && v.hashtags.length > 0 && (
                      <div className="text-[11px] text-blue-700 font-medium">
                        {v.hashtags.join(' ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Empty State */}
            {!isGenerating && !videoScript && generatedVariations.length === 0 && (
              <div className="bg-white p-12 rounded-xl border border-slate-200 text-center space-y-3 shadow-2xs">
                <Wand2 className="w-8 h-8 text-slate-400 mx-auto" />
                <h4 className="text-sm font-semibold text-slate-900">Creative Workspace Ready</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  Configure your brand persona, channel, and campaign topic on the left and click <strong>"Generate A/B Variations"</strong>.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Sub-tab 2: COMPLIANCE AUDIT EXPLANATION */}
        {selectedSubTab === 'compliance' && (
          <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-3 text-xs shadow-2xs">
            <h4 className="font-bold text-slate-900 uppercase text-[11px]">Automated 6-Rule MAS / MOH Audit Engine</h4>
            <div className="space-y-2 text-slate-700 leading-relaxed">
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900">Superlatives & Guarantees:</strong>
                  <p className="text-[11px] text-slate-500">Scans for prohibited claims like "100%", "guaranteed payout", "zero risk", or "best in Singapore".</p>
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900">Mandatory Statutory Disclaimers:</strong>
                  <p className="text-[11px] text-slate-500">Requires licensed intermediary advisory notes on all external marketing communications.</p>
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900">DoctorShield Medical Disclaimers:</strong>
                  <p className="text-[11px] text-slate-500">Prohibits clinical advice or promising malpractice indemnification outcome certainty.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sub-tab 3: RESEARCH CONTEXT */}
        {selectedSubTab === 'research' && (
          <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-3 text-xs shadow-2xs">
            <h4 className="font-bold text-slate-900 uppercase text-[11px]">Active Competitor Signals Considered</h4>
            <div className="space-y-2">
              {brandCompetitors.slice(0, 3).map((c) => (
                <div key={c.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-blue-700 font-semibold">{c.name}</span>
                    <span className="text-slate-500 capitalize">{c.category}</span>
                  </div>
                  <p className="text-[11px] text-slate-700">{c.summary}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sub-tab 4: INJECTED LESSONS */}
        {selectedSubTab === 'lessons' && (
          <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-3 text-xs shadow-2xs">
            <h4 className="font-bold text-slate-900 uppercase text-[11px]">Closed-Loop Rules Influencing This Draft</h4>
            <div className="space-y-2">
              {activeBrandLessons.slice(0, 4).map((l) => (
                <div key={l.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-indigo-700 uppercase font-semibold">{l.category.replace(/_/g, ' ')}</span>
                    <span className="text-slate-500">Triggered {l.frequency}x</span>
                  </div>
                  <p className="text-[11px] text-slate-700">{l.lesson}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* RIGHT COLUMN (3 Cols): AI Intelligence Signals Panel */}
      <div className="lg:col-span-3 space-y-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4 shadow-2xs">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Intelligence Telemetry
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Pre-generation signals</p>
          </div>

          <div className="space-y-3 text-xs">
            {/* Metric 1: Compliance Gauge */}
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 text-[11px]">Compliance Index</span>
                <span className="font-bold text-emerald-700 text-sm">85+ Target</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                <div className="w-[88%] h-full bg-emerald-600 rounded-full" />
              </div>
              <span className="text-[10px] text-slate-500">Automated MAS & MOH Gate</span>
            </div>

            {/* Metric 2: Active Lessons */}
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 text-[11px]">Active Memory Rules</span>
                <span className="font-bold text-indigo-900 text-sm">{activeBrandLessons.length}</span>
              </div>
              <span className="text-[10px] text-slate-500">Injected into system prompt</span>
            </div>

            {/* Metric 3: Research Signals */}
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 text-[11px]">Competitor Signals</span>
                <span className="font-bold text-blue-800 text-sm">{brandCompetitors.length}</span>
              </div>
              <span className="text-[10px] text-slate-500">Market intelligence points</span>
            </div>

            {/* Metric 4: Human Review Required */}
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-amber-900 text-[11px] font-semibold">Human Review Gate</span>
                <span className="font-bold text-amber-900 text-[10px] px-2 py-0.5 rounded bg-amber-100 border border-amber-300">
                  MANDATORY
                </span>
              </div>
              <span className="text-[10px] text-amber-800/80 block">
                Never automatically posted without explicit sign-off
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
