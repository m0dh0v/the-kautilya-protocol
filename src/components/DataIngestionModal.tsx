import React, { useState } from "react";
import { Entity, Relationship, SuspiciousPattern } from "../types/intelligence";
import {
  FileUp,
  Sparkles,
  X,
  CheckCircle2,
  FileText,
  Phone,
  CreditCard,
  Eye,
  AlertTriangle,
  Send,
  HelpCircle,
  Database,
} from "lucide-react";

interface DataIngestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataIngested: (
    newEntities: Entity[],
    newLinks: Relationship[],
    newPatterns: SuspiciousPattern[],
    sourceTitle: string
  ) => void;
}

const sampleTemplates = [
  {
    name: "FIR: Interstate Safehouse Raid Statement",
    type: "fir",
    text: `CONFIDENTIAL POLICE COMPLAINT (NCRB SPECIAL INVESTIGATION TEAM):
Accused named Vikram Singh @ Vicky Thakur instructed subordinate Sunita Rao to transfer three female victims from Paharganj safehouse to Siliguri border point. Subordinate Amit Paswan was ordered to drive Mahindra Scorpio DL 1C AB 4921. Intercepted call between +91-98712-40192 and +91-88001-99482 verified departure time at 02:30 AM. Payment of ₹1,20,000 received via Axis Bank account 9120100482910 under pretext of NGO training donation. Co-conspirator Rajan Verma facilitated Hawala cash conversion.`,
  },
  {
    name: "CDR: Midnight Tower Dump Intercept",
    type: "cdr",
    text: `CELLULAR INTERCEPT LOG (C-DOT CMS):
Target MSISDN +91-98110-29381 registered to fake identity Satish Kumar was active under Cell Tower 1042-NCR (Imperial Sector, Delhi). Made 4 calls of average duration 180s to Sunita Rao (+91-98712-40192) between 23:14 and 23:55 hrs. Tower triangulation confirms both devices within 150m radius of Paharganj Safehouse. Fastag vehicle ping DL 1C AB 4921 registered at 02:41 AM at Western Peripheral Toll Plaza.`,
  },
  {
    name: "FIU-IND: Hawala Smurfing Trail",
    type: "financial",
    text: `FINANCIAL INTELLIGENCE UNIT (FIU-IND) SUSPICIOUS TRANSACTION ADVISORY:
Entity 'Prerna Skill Uplift Foundation' routed ₹19,80,000 across 40 transactions of ₹49,500 each to avoid mandatory ₹50,000 reporting threshold. Beneficiary account Yes Bank A/C 003891002341 belonging to Rajan Verma. Immediate cash withdrawal executed from Chandni Chowk ATMs followed by purchase of 24,000 USDT on Tron address TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t.`,
  },
];

export const DataIngestionModal: React.FC<DataIngestionModalProps> = ({
  isOpen,
  onClose,
  onDataIngested,
}) => {
  const [sourceType, setSourceType] = useState<"fir" | "cdr" | "financial" | "surveillance" | "intel">("fir");
  const [sourceTitle, setSourceTitle] = useState("Interstate Intelligence Dispatch");
  const [officerBadge, setOfficerBadge] = useState("INSP-K-SHARMA-882");
  const [rawText, setRawText] = useState(sampleTemplates[0].text);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionResult, setExtractionResult] = useState<any | null>(null);

  if (!isOpen) return null;

  const handleApplyTemplate = (tmpl: (typeof sampleTemplates)[0]) => {
    setSourceType(tmpl.type as any);
    setSourceTitle(tmpl.name);
    setRawText(tmpl.text);
    setExtractionResult(null);
  };

  const handleRunExtraction = async () => {
    if (!rawText.trim()) return;
    setIsExtracting(true);
    setExtractionResult(null);

    try {
      const res = await fetch("/api/ai/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: rawText,
          sourceType,
        }),
      });
      const data = await res.json();
      setExtractionResult(data);
    } catch (err) {
      console.error("Extraction error:", err);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleConfirmAndMerge = async () => {
    if (!extractionResult) return;

    // First commit to Blockchain Ledger
    try {
      await fetch("/api/blockchain/record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "AI_INGESTION_" + sourceType.toUpperCase(),
          officerBadge,
          caseId: "NCRB-WD-2024-092",
          summary: `Ingested ${sourceTitle}: Extracted ${extractionResult.entities?.length || 0} entities and ${extractionResult.relationships?.length || 0} links.`,
          rawData: extractionResult,
        }),
      });
    } catch (e) {
      console.error("Blockchain record error:", e);
    }

    const newEntities: Entity[] = extractionResult.entities || [];
    const newLinks: Relationship[] = (extractionResult.relationships || []).map((r: any, idx: number) => ({
      id: `link_${Date.now()}_${idx}`,
      source: r.source,
      target: r.target,
      relationshipType: r.relationshipType || "communicated_with",
      evidenceSummary: r.evidenceSummary || "Discovered via AI Ingestion",
      weight: r.weight || 6,
      confidence: r.confidence || 0.85,
    }));
    const newPatterns: SuspiciousPattern[] = (extractionResult.suspiciousPatterns || []).map((p: any, idx: number) => ({
      id: `pat_${Date.now()}_${idx}`,
      patternName: p.patternName,
      severity: p.severity || "high",
      description: p.description,
      involvedEntities: p.involvedEntities || [],
      detectedTimestamp: new Date().toISOString(),
      indicators: [p.description],
    }));

    onDataIngested(newEntities, newLinks, newPatterns, sourceTitle);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-950 border border-indigo-800 text-indigo-400">
              <FileUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Multi-Source Intelligence Ingestion Engine</h2>
              <p className="text-xs text-slate-400">
                Extract structured entities, relationships, and suspicious patterns using Gemini AI.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Quick Presets */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Load Law Enforcement Intelligence Sample
            </label>
            <div className="flex flex-wrap gap-2">
              {sampleTemplates.map((t, idx) => (
                <button
                  key={idx}
                  onClick={() => handleApplyTemplate(t)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-200 font-medium transition-all"
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Source Category</label>
              <select
                value={sourceType}
                onChange={(e) => setSourceType(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200"
              >
                <option value="fir">FIR / Police Incident Report</option>
                <option value="cdr">Call Detail Record (CDR) Tower Dump</option>
                <option value="financial">Financial / Hawala / Bank Statement</option>
                <option value="surveillance">Physical Surveillance & Recon</option>
                <option value="intel">Cyber Intelligence / Intercepted Chat</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Document Reference / Title</label>
              <input
                type="text"
                value={sourceTitle}
                onChange={(e) => setSourceTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200"
                placeholder="e.g. Special Cell Intercept Dispatch"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Ingesting Officer Badge ID</label>
              <input
                type="text"
                value={officerBadge}
                onChange={(e) => setOfficerBadge(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 font-mono"
                placeholder="e.g. INSP-K-SHARMA-882"
              />
            </div>
          </div>

          {/* Raw Text Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Raw Crime Data / Unstructured Statement Text
            </label>
            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              rows={5}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 leading-relaxed font-mono focus:border-indigo-500 focus:outline-none"
              placeholder="Paste FIR narrative, CDR analysis summary, Bank STR log, or surveillance observation here..."
            />
          </div>

          {/* Extraction Trigger Button */}
          <div className="flex justify-end">
            <button
              onClick={handleRunExtraction}
              disabled={isExtracting || !rawText.trim()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg transition-all disabled:opacity-50 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isExtracting ? "Extracting Entities via Gemini AI..." : "Run AI Entity & Relationship Extraction"}</span>
            </button>
          </div>

          {/* Extraction Preview Results */}
          {extractionResult && (
            <div className="bg-slate-950/80 border border-indigo-900/60 rounded-xl p-4 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-slate-200">AI Extraction Summary</span>
                </div>
                <span className="text-[11px] text-indigo-400 font-mono">
                  {extractionResult.entities?.length || 0} Entities • {extractionResult.relationships?.length || 0} Links
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">{extractionResult.summary}</p>

              {/* Extracted Entities preview */}
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Extracted Entities
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {extractionResult.entities?.map((ent: any, i: number) => (
                    <span
                      key={i}
                      className="px-2 py-1 rounded-md bg-slate-900 border border-slate-700 text-xs text-slate-200 font-medium flex items-center gap-1.5"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                      <span>{ent.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">({ent.type})</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Suspicious Patterns preview */}
              {extractionResult.suspiciousPatterns?.length > 0 && (
                <div className="bg-amber-950/30 border border-amber-800/50 rounded-lg p-2.5 text-xs">
                  <span className="text-amber-400 font-bold block mb-1">Detected Suspicious Pattern:</span>
                  <p className="text-amber-200 text-[11px]">
                    {extractionResult.suspiciousPatterns[0].patternName} — {extractionResult.suspiciousPatterns[0].description}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-mono">
            Cryptographic Block Hash will be automatically signed upon ingestion.
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmAndMerge}
              disabled={!extractionResult}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow disabled:opacity-40 transition-all cursor-pointer"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Append to Case Graph & Blockchain</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
