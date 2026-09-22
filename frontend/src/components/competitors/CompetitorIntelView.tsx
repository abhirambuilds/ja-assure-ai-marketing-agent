import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Globe, 
  ExternalLink, 
  Sparkles, 
  Crosshair,
  Shield,
  AlertTriangle,
  AlertCircle,
  TrendingUp,
  CheckCircle2,
  RefreshCw,
  Zap,
  Activity,
  Filter,
  Eye,
  FileText
} from 'lucide-react';
import type { 
  Competitor, 
  CompetitorChange, 
  CompetitorBattlecard, 
  CompetitorSnapshot 
} from '../../types';
import { api } from '../../services/api';

interface CompetitorIntelViewProps {
  competitors: Competitor[];
  scrapeUrlInput: string;
  setScrapeUrlInput: (url: string) => void;
  scrapeBrand: 'jade' | 'doctorshield' | 'jaguartransit';
  setScrapeBrand: (brand: 'jade' | 'doctorshield' | 'jaguartransit') => void;
  scrapeResult: any;
  actionLoading: string | null;
  onScrape: () => void;
  getSourceTypeBadge: (source?: string, sourceType?: string) => React.ReactNode;
  getBrandBadge: (brand: string) => React.ReactNode;
}

export const CompetitorIntelView: React.FC<CompetitorIntelViewProps> = ({
  competitors,
  scrapeUrlInput,
  setScrapeUrlInput,
  scrapeBrand,
  setScrapeBrand,
  scrapeResult,
  actionLoading,
  onScrape,
  getSourceTypeBadge,
  getBrandBadge
}) => {
  // Navigation Sub-tabs: 1. Competitors, 2. Profile, 3. Changes, 4. Battlecard
  const [activeTab, setActiveTab] = useState<'competitors' | 'profile' | 'changes' | 'battlecard'>('competitors');
  const [selectedCompId, setSelectedCompId] = useState<number | null>(competitors[0]?.id || null);

  // Filters
  const [filterBrand, setFilterBrand] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterThreat, setFilterThreat] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Scraper UI collapse state
  const [showScraper, setShowScraper] = useState<boolean>(false);

  // Radar State
  const [scanningCompId, setScanningCompId] = useState<number | null>(null);
  const [scanningAll, setScanningAll] = useState<boolean>(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  // Changes & Battlecards State
  const [changesList, setChangesList] = useState<CompetitorChange[]>([]);
  const [changesLoading, setChangesLoading] = useState<boolean>(false);
  const [battlecard, setBattlecard] = useState<CompetitorBattlecard | null>(null);
  const [battlecardLoading, setBattlecardLoading] = useState<boolean>(false);
  const [snapshots, setSnapshots] = useState<CompetitorSnapshot[]>([]);

  // Keep selected competitor synced
  useEffect(() => {
    if (!selectedCompId && competitors.length > 0) {
      setSelectedCompId(competitors[0].id);
    }
  }, [competitors, selectedCompId]);

  const selectedCompetitor = competitors.find(c => c.id === selectedCompId) || competitors[0];

  // Fetch changes when switching to 'changes' tab or on initial load
  useEffect(() => {
    if (activeTab === 'changes') {
      loadChanges();
    }
  }, [activeTab, selectedCompId]);

  // Fetch battlecard when switching to 'battlecard' or changing selected competitor
  useEffect(() => {
    if (activeTab === 'battlecard' && selectedCompId) {
      loadBattlecard(selectedCompId);
    }
    if (activeTab === 'profile' && selectedCompId) {
      loadSnapshots(selectedCompId);
    }
  }, [activeTab, selectedCompId]);

  const loadChanges = async () => {
    setChangesLoading(true);
    try {
      const data = await api.getCompetitorChanges();
      setChangesList(data);
    } catch (err) {
      console.error('Failed to load competitor changes', err);
    } finally {
      setChangesLoading(false);
    }
  };

  const loadBattlecard = async (compId: number) => {
    setBattlecardLoading(true);
    try {
      const bc = await api.getCompetitorBattlecard(compId);
      setBattlecard(bc);
    } catch (err) {
      console.error('Failed to load battlecard', err);
    } finally {
      setBattlecardLoading(false);
    }
  };

  const loadSnapshots = async (compId: number) => {
    try {
      const sn = await api.getCompetitorSnapshots(compId);
      setSnapshots(sn);
    } catch (err) {
      console.error('Failed to load snapshots', err);
    }
  };

  const handleScanSingle = async (compId: number) => {
    setScanningCompId(compId);
    setScanMessage(null);
    try {
      const res = await api.scanCompetitor(compId);
      setScanMessage(`✓ Website scanned! Hash: ${res.content_hash.slice(0, 8)}... (${res.changes_detected} changes detected).`);
      if (activeTab === 'changes') loadChanges();
      if (activeTab === 'battlecard') loadBattlecard(compId);
      if (activeTab === 'profile') loadSnapshots(compId);
    } catch (err: any) {
      alert(`Scan failed: ${err.message}`);
    } finally {
      setScanningCompId(null);
    }
  };

  const handleScanAll = async () => {
    setScanningAll(true);
    setScanMessage(null);
    try {
      const res = await api.scanAllCompetitors();
      setScanMessage(`✓ Batch scan completed across ${res.scanned_count} competitors.`);
      if (activeTab === 'changes') loadChanges();
    } catch (err: any) {
      alert(`Batch scan failed: ${err.message}`);
    } finally {
      setScanningAll(false);
    }
  };

  const handleRegenerateBattlecard = async (compId: number) => {
    setBattlecardLoading(true);
    try {
      const bc = await api.regenerateCompetitorBattlecard(compId);
      setBattlecard(bc);
    } catch (err: any) {
      alert(`Battlecard refresh failed: ${err.message}`);
    } finally {
      setBattlecardLoading(false);
    }
  };

  const getThreatBadge = (threat?: string) => {
    const t = (threat || 'medium').toLowerCase();
    if (t === 'high') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
          <AlertTriangle className="w-3 h-3 text-rose-600" /> High Threat
        </span>
      );
    }
    if (t === 'medium') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
          <AlertCircle className="w-3 h-3 text-amber-600" /> Medium Threat
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Low Threat
      </span>
    );
  };

  const getSeverityBadge = (severity?: string) => {
    const s = (severity || 'major').toLowerCase();
    if (s === 'critical') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-300 uppercase tracking-wide">
          Critical
        </span>
      );
    }
    if (s === 'major') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 uppercase tracking-wide">
          Major
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-wide">
        Minor
      </span>
    );
  };

  // Filtered Competitor List
  const filteredCompetitors = competitors.filter(c => {
    if (filterBrand !== 'all' && c.brand !== filterBrand) return false;
    if (filterCategory !== 'all' && c.category !== filterCategory) return false;
    if (filterThreat !== 'all' && (c.threat_level || 'medium') !== filterThreat) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        (c.domain || '').toLowerCase().includes(q) ||
        (c.pricing_summary || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const isScraping = actionLoading === 'scraping';

  return (
    <div className="space-y-6">
      {/* Competitor Radar Main Navigation Tabs */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              Competitor Radar & Intelligence Engine
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live website monitoring, SHA-256 snapshot change detection, and tactical sales battlecards
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowScraper(!showScraper)}
              className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Search className="w-3.5 h-3.5 text-slate-500" />
              {showScraper ? 'Hide URL Scraper' : 'Scrape Custom URL'}
            </button>
            <button
              onClick={handleScanAll}
              disabled={scanningAll}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${scanningAll ? 'animate-spin' : ''}`} />
              {scanningAll ? 'Scanning All...' : 'Scan All Competitors'}
            </button>
          </div>
        </div>

        {/* Tab Navigation Pill Bar */}
        <div className="flex items-center gap-2 pt-3 overflow-x-auto">
          <button
            onClick={() => setActiveTab('competitors')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'competitors'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            TAB 1 — Competitors ({competitors.length})
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            TAB 2 — Competitor Profile
          </button>

          <button
            onClick={() => setActiveTab('changes')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'changes'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            TAB 3 — Detected Changes {changesList.length > 0 && `(${changesList.length})`}
          </button>

          <button
            onClick={() => setActiveTab('battlecard')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'battlecard'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            TAB 4 — Tactical Battlecard
          </button>
        </div>

        {/* Global Scan Feedback Banner */}
        {scanMessage && (
          <div className="mt-3 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center justify-between">
            <span>{scanMessage}</span>
            <button onClick={() => setScanMessage(null)} className="text-emerald-600 hover:text-emerald-900 text-xs font-bold">×</button>
          </div>
        )}
      </div>

      {/* Collapsible Scraper Tool */}
      {showScraper && (
        <div className="bg-white p-5 rounded-xl border border-blue-200 bg-blue-50/20 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <Search className="w-4 h-4 text-blue-600" />
              Live Competitor URL Scraper & Extraction
            </h3>
            <span className="text-[10px] font-semibold text-blue-800 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
              SSRF Protected • Strict 8s Timeout
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 text-xs">
            <div className="md:col-span-3">
              <label className="text-slate-700 font-semibold block">Target Persona / Brand</label>
              <select
                value={scrapeBrand}
                onChange={(e) => setScrapeBrand(e.target.value as any)}
                className="w-full mt-1 bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-1 focus:ring-blue-500"
              >
                <option value="jade">Jade (Luxury Jewellery)</option>
                <option value="doctorshield">DoctorShield (Med Malpractice)</option>
                <option value="jaguartransit">Jaguar Transit (High-Value Cargo)</option>
              </select>
            </div>

            <div className="md:col-span-6">
              <label className="text-slate-700 font-semibold block">Public Competitor URL</label>
              <div className="relative mt-1">
                <Globe className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  value={scrapeUrlInput}
                  onChange={(e) => setScrapeUrlInput(e.target.value)}
                  placeholder="https://competitor.com/jewellers-block"
                  className="w-full bg-white border border-slate-300 rounded-lg py-2 pl-8 pr-3 text-slate-900 text-xs focus:ring-1 focus:ring-blue-500 font-mono"
                />
              </div>
            </div>

            <div className="md:col-span-3 flex items-end">
              <button
                onClick={onScrape}
                disabled={isScraping || !scrapeUrlInput}
                className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
              >
                <Search className="w-3.5 h-3.5" />
                {isScraping ? 'Extracting...' : 'Scrape & Ingest'}
              </button>
            </div>
          </div>

          {scrapeResult && (
            <div className="p-3.5 rounded-lg bg-blue-50 border border-blue-200 text-xs space-y-1">
              <span className="font-bold text-blue-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" /> Extracted Profile: {scrapeResult.name}
              </span>
              <p className="text-slate-700">{scrapeResult.summary || scrapeResult.positioning}</p>
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 1: COMPETITOR LIST & RADAR OVERVIEW                              */}
      {/* ==================================================================== */}
      {activeTab === 'competitors' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-2xs text-xs">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-1.5 text-slate-500 font-semibold">
                <Filter className="w-3.5 h-3.5" /> Filter:
              </div>

              {/* Brand Filter */}
              <select
                value={filterBrand}
                onChange={(e) => setFilterBrand(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 font-medium"
              >
                <option value="all">All JA Brands</option>
                <option value="jade">Jade</option>
                <option value="doctorshield">DoctorShield</option>
                <option value="jaguartransit">Jaguar Transit</option>
              </select>

              {/* Category Filter */}
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 font-medium"
              >
                <option value="all">All Sectors</option>
                <option value="jewellery">Jewellery (Jade)</option>
                <option value="transit">Transit & Specie (Jaguar)</option>
                <option value="medical">Medical Indemnity (DoctorShield)</option>
              </select>

              {/* Threat Level Filter */}
              <select
                value={filterThreat}
                onChange={(e) => setFilterThreat(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 font-medium"
              >
                <option value="all">All Threat Levels</option>
                <option value="high">High Threat</option>
                <option value="medium">Medium Threat</option>
                <option value="low">Low Threat</option>
              </select>
            </div>

            {/* Search Box */}
            <div className="w-full sm:w-64">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search competitors, underwriters..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900 text-xs focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Competitor Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCompetitors.map((c) => {
              const isSelected = selectedCompId === c.id;
              const isScanningThis = scanningCompId === c.id;

              return (
                <div
                  key={c.id}
                  className={`bg-white p-5 rounded-xl border transition-all shadow-2xs flex flex-col justify-between ${
                    isSelected ? 'border-blue-500 ring-1 ring-blue-500/20' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-slate-900">{c.name}</h4>
                          {getSourceTypeBadge(c.source, c.source_type)}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-500">
                          {c.brand && getBrandBadge(c.brand)}
                          <span className="capitalize font-medium">{c.category}</span>
                          <span>•</span>
                          <span>{c.market || 'Singapore'}</span>
                          {c.domain && (
                            <>
                              <span>•</span>
                              <span className="font-mono text-[10px] text-slate-400">{c.domain}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0 flex flex-col items-end gap-1">
                        {getThreatBadge(c.threat_level)}
                        <span className="text-[10px] text-slate-400">
                          {c.is_active !== false ? '● Active' : '○ Inactive'}
                        </span>
                      </div>
                    </div>

                    {/* Underwriter & Capacity */}
                    {c.underwriter && (
                      <div className="text-xs">
                        <span className="text-slate-500 font-semibold block text-[10px] uppercase">Underwriter / Security:</span>
                        <span className="text-slate-800 font-medium">{c.underwriter}</span>
                      </div>
                    )}

                    {/* Pricing Summary */}
                    {c.pricing_summary && (
                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1">
                        <span className="text-[10px] font-bold text-slate-600 uppercase block">Monitored Pricing Terms</span>
                        <p className="text-slate-700 line-clamp-2">{c.pricing_summary}</p>
                      </div>
                    )}

                    {/* Coverage Strengths & Weaknesses snippets */}
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      {c.coverage_strengths && (
                        <div className="p-2 rounded bg-emerald-50/50 border border-emerald-100">
                          <span className="font-bold text-emerald-800 text-[10px] block">Strength:</span>
                          <p className="text-slate-600 line-clamp-2">{c.coverage_strengths}</p>
                        </div>
                      )}
                      {c.coverage_weaknesses && (
                        <div className="p-2 rounded bg-rose-50/50 border border-rose-100">
                          <span className="font-bold text-rose-800 text-[10px] block">Vulnerability:</span>
                          <p className="text-slate-600 line-clamp-2">{c.coverage_weaknesses}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions & Footer */}
                  <div className="pt-3.5 mt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                    <span className="text-[10px] text-slate-400">
                      {c.last_monitored_at ? `Monitored: ${new Date(c.last_monitored_at).toLocaleDateString()}` : 'Baseline Active'}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleScanSingle(c.id)}
                        disabled={isScanningThis}
                        className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        title="Fetch website and detect changes"
                      >
                        <RefreshCw className={`w-3 h-3 ${isScanningThis ? 'animate-spin' : ''}`} />
                        {isScanningThis ? 'Scanning...' : 'Scan'}
                      </button>

                      <button
                        onClick={() => {
                          setSelectedCompId(c.id);
                          setActiveTab('profile');
                        }}
                        className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3 h-3 text-slate-500" />
                        Profile
                      </button>

                      <button
                        onClick={() => {
                          setSelectedCompId(c.id);
                          setActiveTab('battlecard');
                        }}
                        className="px-2.5 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold flex items-center gap-1 cursor-pointer border border-blue-200"
                      >
                        <Zap className="w-3 h-3 text-blue-600" />
                        Battlecard
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: COMPETITOR PROFILE & OFFERINGS                                */}
      {/* ==================================================================== */}
      {activeTab === 'profile' && selectedCompetitor && (
        <div className="space-y-5">
          {/* Profile Header Card */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-4 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-900">{selectedCompetitor.name}</h3>
                  {getSourceTypeBadge(selectedCompetitor.source, selectedCompetitor.source_type)}
                  {getThreatBadge(selectedCompetitor.threat_level)}
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
                  {selectedCompetitor.brand && getBrandBadge(selectedCompetitor.brand)}
                  <span className="capitalize font-semibold">{selectedCompetitor.category}</span>
                  <span>•</span>
                  <span>Market: {selectedCompetitor.market || 'Singapore'}</span>
                  {selectedCompetitor.url && (
                    <>
                      <span>•</span>
                      <a
                        href={selectedCompetitor.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline inline-flex items-center gap-1 font-mono text-xs"
                      >
                        {selectedCompetitor.url}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={selectedCompId || ''}
                  onChange={(e) => setSelectedCompId(Number(e.target.value))}
                  className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-800"
                >
                  {competitors.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>

                <button
                  onClick={() => handleScanSingle(selectedCompetitor.id)}
                  disabled={scanningCompId === selectedCompetitor.id}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${scanningCompId === selectedCompetitor.id ? 'animate-spin' : ''}`} />
                  Scan Now
                </button>
              </div>
            </div>

            {/* Profile Overview & Underwriting */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
                <span className="font-bold text-slate-500 uppercase text-[10px] block">Target Customer Segment</span>
                <p className="font-semibold text-slate-800">{selectedCompetitor.target_customer_size || 'Commercial & SME Enterprises'}</p>
                <p className="text-slate-500 text-[11px]">Primary market positioning focus</p>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
                <span className="font-bold text-slate-500 uppercase text-[10px] block">Underwriter & Risk Pool</span>
                <p className="font-semibold text-slate-800">{selectedCompetitor.underwriter || 'Commercial Market Capacity'}</p>
                <p className="text-slate-500 text-[11px]">Balance sheet security tier</p>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
                <span className="font-bold text-slate-500 uppercase text-[10px] block">Monitoring Status</span>
                <p className="font-semibold text-slate-800">
                  {selectedCompetitor.last_monitored_at ? new Date(selectedCompetitor.last_monitored_at).toLocaleString() : 'Baseline Established'}
                </p>
                <p className="text-slate-500 text-[11px]">SHA-256 Verified</p>
              </div>
            </div>

            {/* In-depth Pricing Summary */}
            <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100 space-y-2">
              <h4 className="font-bold text-xs uppercase tracking-wider text-blue-950 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-blue-600" /> Documented Pricing & Rate Structure
              </h4>
              <p className="text-xs text-slate-700 leading-relaxed font-sans">
                {selectedCompetitor.pricing_summary || 'Custom commercial underwriting rating tier.'}
              </p>
            </div>

            {/* Coverage Strengths vs Weaknesses */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-2">
                <h5 className="font-bold text-xs uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Coverage Strengths & Endorsements
                </h5>
                <p className="text-xs text-slate-700 leading-relaxed font-sans">
                  {selectedCompetitor.coverage_strengths || 'Established brand capacity and regional presence.'}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-rose-50/60 border border-rose-200 space-y-2">
                <h5 className="font-bold text-xs uppercase tracking-wider text-rose-900 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-600" /> Coverage Vulnerabilities & Exclusions
                </h5>
                <p className="text-xs text-slate-700 leading-relaxed font-sans">
                  {selectedCompetitor.coverage_weaknesses || 'Traditional manual proposal review and rigid warranty conditions.'}
                </p>
              </div>
            </div>

            {/* Historical Snapshots Table */}
            {snapshots.length > 0 && (
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <h5 className="font-bold text-xs uppercase tracking-wider text-slate-700">
                  Archived Website Snapshots ({snapshots.length})
                </h5>
                <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                      <tr>
                        <th className="p-2.5">Date</th>
                        <th className="p-2.5">Page Title</th>
                        <th className="p-2.5">SHA-256 Hash</th>
                        <th className="p-2.5">Extracted Base Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {snapshots.map((s) => (
                        <tr key={s.id} className="hover:bg-slate-50">
                          <td className="p-2.5 font-mono text-[10px] text-slate-500">
                            {new Date(s.snapshot_date).toLocaleString()}
                          </td>
                          <td className="p-2.5 font-medium">{s.page_title || s.page_url}</td>
                          <td className="p-2.5 font-mono text-[10px] text-blue-700">
                            {s.content_hash ? s.content_hash.slice(0, 16) : 'N/A'}
                          </td>
                          <td className="p-2.5">{s.pricing_data?.base_rate || 'Standard'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 3: DETECTED CHANGES RADAR FEED                                   */}
      {/* ==================================================================== */}
      {activeTab === 'changes' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between shadow-2xs">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-600" />
                Detected Competitor Market & Policy Shifts
              </h3>
              <p className="text-xs text-slate-500">
                Sequential snapshot diffing on pricing, warranties, endorsements, and commercial campaigns
              </p>
            </div>

            <button
              onClick={loadChanges}
              disabled={changesLoading}
              className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${changesLoading ? 'animate-spin' : ''}`} />
              Refresh Feed
            </button>
          </div>

          {changesLoading ? (
            <div className="p-8 text-center text-xs text-slate-500">Loading detected competitor shifts...</div>
          ) : changesList.length === 0 ? (
            <div className="bg-white p-8 rounded-xl border border-slate-200 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
              <h4 className="font-bold text-sm text-slate-800">No New Diff Discrepancies</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Monitored competitor websites match baseline snapshots. Click "Scan All Competitors" to re-verify public endpoints.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {changesList.map((ch) => {
                const comp = competitors.find(c => c.id === ch.competitor_id);

                return (
                  <div key={ch.id} className="bg-white p-4 rounded-xl border border-slate-200 space-y-3 shadow-2xs hover:border-slate-300 transition-all">
                    <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-2.5">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {getSeverityBadge(ch.severity)}
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 uppercase">
                            {ch.change_type.replace('_', ' ')}
                          </span>
                          <span className="font-bold text-xs text-slate-900">
                            {comp ? comp.name : `Competitor #${ch.competitor_id}`}
                          </span>
                        </div>
                        <h4 className="font-bold text-xs text-slate-800">{ch.title}</h4>
                      </div>

                      <span className="text-[10px] text-slate-400 font-mono shrink-0">
                        {new Date(ch.detected_at).toLocaleString()}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 font-sans leading-relaxed">{ch.description}</p>

                    {/* Before vs After Diff Block */}
                    {(ch.old_value || ch.new_value) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono">
                        <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-900">
                          <span className="text-[10px] uppercase font-bold text-rose-700 block mb-1">Previous Snapshot Value:</span>
                          <span className="text-[11px]">{ch.old_value || 'None'}</span>
                        </div>
                        <div className="p-2.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-900">
                          <span className="text-[10px] uppercase font-bold text-emerald-700 block mb-1">Detected Current Value:</span>
                          <span className="text-[11px]">{ch.new_value || 'None'}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 4: TACTICAL SALES BATTLECARDS                                    */}
      {/* ==================================================================== */}
      {activeTab === 'battlecard' && selectedCompetitor && (
        <div className="space-y-5">
          {/* Battlecard Header & Selector */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
                  Sales Enablement Battlecard
                </span>
                <span className="text-xs font-bold text-slate-800">
                  JA Assure {battlecard?.ja_product || 'Jade'} vs. {selectedCompetitor.name}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Grounded comparison: Verified policy underwriting terms contrasted with JA Assure differentiators
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedCompId || ''}
                onChange={(e) => setSelectedCompId(Number(e.target.value))}
                className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-800"
              >
                {competitors.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              <button
                onClick={() => handleRegenerateBattlecard(selectedCompetitor.id)}
                disabled={battlecardLoading}
                className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${battlecardLoading ? 'animate-spin' : ''}`} />
                Regenerate
              </button>
            </div>
          </div>

          {battlecardLoading ? (
            <div className="p-8 text-center text-xs text-slate-500">Synthesizing tactical sales battlecard...</div>
          ) : battlecard ? (
            <div className="space-y-4">
              {/* Sales Pitch Hook Banner */}
              {battlecard.sales_pitch_hook && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white space-y-1 shadow-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-200 block flex items-center gap-1">
                    <Zap className="w-3 h-3 text-amber-300" /> Sales Pitch Opening Hook
                  </span>
                  <p className="text-sm font-semibold leading-relaxed">
                    "{battlecard.sales_pitch_hook}"
                  </p>
                </div>
              )}

              {/* Head-to-head grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Why JA Assure Wins */}
                <div className="bg-white p-5 rounded-xl border border-emerald-200 space-y-3 shadow-2xs">
                  <div className="flex items-center gap-2 border-b border-emerald-100 pb-2.5">
                    <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                      ✓
                    </div>
                    <div>
                      <h4 className="font-bold text-xs uppercase tracking-wider text-emerald-950">Why JA Assure Wins</h4>
                      <p className="text-[10px] text-emerald-800">Clear differentiators for broker & direct pitches</p>
                    </div>
                  </div>

                  <ul className="space-y-2 text-xs text-slate-700">
                    {battlecard.why_ja_wins.map((point, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Where Competitor Wins */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-3 shadow-2xs">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                    <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
                      ★
                    </div>
                    <div>
                      <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900">Where Competitor Wins</h4>
                      <p className="text-[10px] text-slate-500">Objective market position to acknowledge</p>
                    </div>
                  </div>

                  <ul className="space-y-2 text-xs text-slate-700">
                    {battlecard.where_competitor_wins.map((point, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0 mt-1.5" />
                        <span className="leading-relaxed">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Pricing Comparison Benchmark Callout */}
              {battlecard.pricing_comparison && (
                <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/30 space-y-1.5 shadow-2xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-amber-700" /> Pricing Benchmark Comparison
                  </span>
                  <p className="text-xs text-slate-800 leading-relaxed font-semibold">
                    {battlecard.pricing_comparison}
                  </p>
                </div>
              )}

              {/* Objection Handling Scripts */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-3 shadow-2xs">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <Crosshair className="w-4 h-4 text-blue-600" />
                  Tactical Objection Handling Counter-Scripts
                </h4>

                <div className="space-y-3">
                  {Object.entries(battlecard.objection_handling || {}).map(([objection, counter], idx) => (
                    <div key={idx} className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                        <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px]">Client Objection:</span>
                        <span>"{objection}"</span>
                      </div>
                      <div className="flex items-start gap-2 text-xs text-slate-700 pl-2 border-l-2 border-blue-500">
                        <span className="font-bold text-blue-700 shrink-0 text-[11px]">JA Counter-Pitch:</span>
                        <p className="leading-relaxed">{counter}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Grounding & Evidence Footer */}
              <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-emerald-600" />
                  Grounded on Verified Policy Underwriting Terms & Lloyd's Coverholder Wordings
                </span>
                <span>Last Updated: {new Date(battlecard.updated_at).toLocaleDateString()}</span>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-500">
              No battlecard synthesized yet. Click "Regenerate" above to create one.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
