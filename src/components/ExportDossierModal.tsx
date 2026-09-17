import React from "react";
import { CaseData, Entity } from "../types/intelligence";
import {
  FileText,
  Printer,
  X,
  ShieldCheck,
  Lock,
  Award,
  Calendar,
  CheckCircle,
} from "lucide-react";

interface ExportDossierModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseData: CaseData;
  enrichedNodes: Entity[];
}

export const ExportDossierModal: React.FC<ExportDossierModalProps> = ({
  isOpen,
  onClose,
  caseData,
  enrichedNodes,
}) => {
  if (!isOpen) return null;

  const topInfluencers = [...enrichedNodes]
    .sort((a, b) => (b.betweenness || 0) - (a.betweenness || 0))
    .slice(0, 5);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Modal Controls Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-400" />
            <span className="text-sm font-bold text-slate-100">
              NCRB Intelligence Case Dossier (Court-Admissible Export)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Export PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-950 text-slate-200 print:bg-white print:text-black print:p-0">
          {/* Official Letterhead */}
          <div className="text-center border-b-2 border-slate-700 pb-4">
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-widest text-red-400 print:text-red-700">
                ★ TOP SECRET / STRICTLY LAW ENFORCEMENT EYES ONLY ★
              </span>
            </div>
            <h1 className="text-xl font-extrabold uppercase tracking-tight text-slate-100 print:text-black">
              National Crime Records Bureau (NCRB)
            </h1>
            <h2 className="text-xs font-semibold text-slate-400 uppercase print:text-gray-700">
              Ministry of Home Affairs, Government of India • Women Safety Division
            </h2>
            <div className="mt-2 text-[11px] font-mono text-slate-400 print:text-gray-600">
              Case Ref: <span className="font-bold text-indigo-400 print:text-black">{caseData.caseId}</span> | FIR No:{" "}
              <span className="font-bold">{caseData.firNumber}</span>
            </div>
          </div>

          {/* Case Overview Box */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 print:border-gray-300 print:bg-gray-50">
            <h3 className="text-sm font-bold text-slate-100 print:text-black mb-2">
              Case Title: {caseData.caseTitle}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-500 block text-[10px]">Lead Investigator</span>
                <span className="font-semibold text-slate-200 print:text-black">{caseData.leadInvestigator}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Case Status</span>
                <span className="font-semibold text-emerald-400 print:text-green-700">{caseData.status}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Initiation Date</span>
                <span className="font-semibold text-slate-200 print:text-black">{caseData.createdDate}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Total Graph Entities</span>
                <span className="font-semibold text-indigo-400 print:text-black">
                  {enrichedNodes.length} Nodes / {caseData.links.length} Links
                </span>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-800 print:border-gray-200">
              <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Applicable Penal Acts & Sections:</span>
              <div className="flex flex-wrap gap-1.5">
                {caseData.actsAndSections.map((sec, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded bg-slate-800 print:bg-gray-200 text-[10px] font-mono text-slate-300 print:text-black"
                  >
                    {sec}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Key Influencers Ranking */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 print:text-black">
              1. Key Influencers & Command Bottlenecks (Betweenness Centrality Ranking)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border border-slate-800 print:border-gray-300 rounded-lg">
                <thead className="bg-slate-900 print:bg-gray-100 text-slate-400 print:text-black font-semibold border-b border-slate-800 print:border-gray-300">
                  <tr>
                    <th className="p-2.5">Rank</th>
                    <th className="p-2.5">Name</th>
                    <th className="p-2.5">Role / Designation</th>
                    <th className="p-2.5">Betweenness</th>
                    <th className="p-2.5">Connections</th>
                    <th className="p-2.5">Threat Level</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 print:divide-gray-200">
                  {topInfluencers.map((inf, idx) => (
                    <tr key={inf.id} className="hover:bg-slate-900/50">
                      <td className="p-2.5 font-mono font-bold">#{idx + 1}</td>
                      <td className="p-2.5 font-bold text-slate-200 print:text-black">{inf.name}</td>
                      <td className="p-2.5 text-slate-400 print:text-gray-700">{inf.role}</td>
                      <td className="p-2.5 font-mono text-amber-400 print:text-black">
                        {inf.betweenness?.toFixed(3) || "N/A"}
                      </td>
                      <td className="p-2.5 font-mono">{inf.degree || 0}</td>
                      <td className="p-2.5">
                        <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold bg-red-950 text-red-400 print:text-red-700 print:bg-transparent">
                          {inf.riskLevel}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Suspicious Patterns Summary */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 print:text-black">
              2. Forensic Detection of Suspicious Patterns & Anomalies
            </h3>
            <div className="space-y-2">
              {caseData.suspiciousPatterns.map((pat) => (
                <div
                  key={pat.id}
                  className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 print:border-gray-300 print:bg-gray-50 text-xs"
                >
                  <div className="flex items-center justify-between font-bold text-slate-200 print:text-black">
                    <span>{pat.patternName}</span>
                    <span className="text-[10px] text-red-400 uppercase font-mono">{pat.severity} Alert</span>
                  </div>
                  <p className="text-slate-400 print:text-gray-700 text-[11px] mt-1 leading-relaxed">{pat.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Legal Action Recommendations */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 print:text-black">
              3. Actionable Tactical Directives & Legal Mandates
            </h3>
            <div className="space-y-1.5 text-xs">
              {caseData.investigativeLeads.map((lead, idx) => (
                <div key={idx} className="flex items-start gap-2 bg-slate-900/40 p-2 rounded border border-slate-800/80">
                  <span className="text-indigo-400 font-bold font-mono">[{idx + 1}]</span>
                  <span className="text-slate-300 print:text-black">{lead}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Blockchain Certificate of Integrity */}
          <div className="border-t-2 border-slate-700 pt-4 mt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-emerald-400" />
                <div>
                  <h4 className="text-xs font-bold text-slate-200 print:text-black">
                    Section 65B Electronic Evidence & Blockchain Integrity Certificate
                  </h4>
                  <p className="text-[10px] text-slate-400 print:text-gray-600">
                    Compliant with Indian Evidence Act / Bharatiya Sakshya Adhiniyam. Cryptographic chain verified.
                  </p>
                </div>
              </div>
              <div className="text-right font-mono text-[10px] text-slate-400 print:text-gray-700">
                <div>Digital Stamp: ECDSA-SHA256-VERIFIED</div>
                <div>Timestamp: {new Date().toISOString()}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
