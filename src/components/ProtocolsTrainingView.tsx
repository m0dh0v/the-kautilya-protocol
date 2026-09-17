import React from "react";
import { BookOpen, ShieldCheck, Scale, Cpu, CheckCircle, FileText, ArrowRight } from "lucide-react";

export const ProtocolsTrainingView: React.FC<{
  onSelectTab: (tab: "network" | "influencers" | "patterns" | "blockchain" | "copilot" | "pathfinder") => void;
  onBackToHome: () => void;
}> = ({ onSelectTab, onBackToHome }) => {
  return (
    <div className="flex-1 w-full overflow-y-auto bg-slate-50 text-slate-900 pb-16">
      <div className="w-full h-1 bg-gradient-to-r from-[#FF9933] via-white to-[#138808]" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2">
              National Security Standards
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Protocols, Legal SOPs & Cyber Training
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Standard operating procedures for Indian law enforcement, digital forensics units, and intelligence analysts.
            </p>
          </div>

          <button
            onClick={onBackToHome}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            Back to Home
          </button>
        </div>

        {/* Modules Grid */}
        <div className="space-y-6">
          {/* Module 1 */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:border-slate-300 transition-all">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center shrink-0">
                <Scale className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 uppercase">
                    Protocol 01
                  </span>
                  <h3 className="font-bold text-base text-slate-900">
                    Bharatiya Sakshya Adhiniyam (BSA 2023) / Section 65B Electronic Admissibility
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-3">
                  Under the new criminal jurisprudence framework (BSA Sections 61-63 replacing Section 65B of the Indian Evidence Act), cryptographic hashing (SHA-256) and immutable ledger timestamps guarantee court admissibility of network graph evidence, CDR tower intercepts, and FIU financial alerts without risk of spoliation challenges.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onSelectTab("blockchain")}
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800"
                  >
                    <span>View Cryptographic Audit Trail</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Module 2 */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:border-slate-300 transition-all">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                <Cpu className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 uppercase">
                    Protocol 02
                  </span>
                  <h3 className="font-bold text-base text-slate-900">
                    SITAICS Key Influencer Disruption & Cut-Point Neutralization SOP
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-3">
                  Guidelines for tactical field disruption: Instead of targeting frontline foot soldiers, officers use Betweenness Centrality to isolate "cutouts" and Hawala couriers. Severing these high-betweenness bridges fractures communications between syndicate kingpins and operational safehouses.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onSelectTab("influencers")}
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800"
                  >
                    <span>Inspect Influencer Matrix</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Module 3 */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:border-slate-300 transition-all">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 uppercase">
                    Protocol 03
                  </span>
                  <h3 className="font-bold text-base text-slate-900">
                    Multi-Source Ingestion & Cross-Agency Intelligence Fusion SOP
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-3">
                  Step-by-step procedure for automated ingestion of police FIRs, Telecom CDR dumps, Financial Intelligence Unit (FIU-IND) Suspicious Transaction Reports (STRs), and STF surveillance logs into the unified entity-relationship schema.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onSelectTab("patterns")}
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800"
                  >
                    <span>View Suspicious Anomaly Engine</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
