import React from "react";
import { Shield, Eye, Database, Cpu, Award, BookOpen, CheckCircle, ExternalLink, Network } from "lucide-react";

export const AboutUsView: React.FC<{ onBackToHome: () => void }> = ({ onBackToHome }) => {
  return (
    <div className="flex-1 w-full overflow-y-auto bg-slate-50 text-slate-900 pb-16">
      {/* Tricolor Subtle Header Bar */}
      <div className="w-full h-1 bg-gradient-to-r from-[#FF9933] via-white to-[#138808]" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-10">
        {/* Title Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-orange-800 text-xs font-bold uppercase tracking-wider mb-3">
            Institutional Research & National Security Deployment
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            About Project KAUTILYA PROTOCOL
          </h1>
          <p className="mt-3 text-base text-slate-600 max-w-3xl mx-auto font-sans">
            An advanced AI and cryptographic intelligence platform developed by{" "}
            <strong className="text-slate-900 font-bold">Team NETRA 404</strong> at the{" "}
            <strong className="text-slate-900">School of Information Technology, Artificial Intelligence & Cyber Security (SITAICS)</strong>,{" "}
            <strong className="text-slate-900">Rashtriya Raksha University (RRU)</strong>, dedicated to multi-agency organized crime network disruption.
          </p>
        </div>

        {/* Team NETRA-404 Image Section */}
        <div className="mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 text-center mb-6">
            Team NETRA-404
          </h2>
          <div className="overflow-hidden rounded-3xl border border-slate-200 shadow-md bg-white">
            <img
              src="/us.jpg"
              alt="Team NETRA-404"
              className="w-full h-[420px] object-cover object-center"
            />
          </div>
        </div>

        {/* Team NETRA 404 Mission Statement */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 mb-4">
              <Network className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-2">Graph Theory & Analytics</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Brandes' algorithm for betweenness centrality, degree centrality, PageRank, and community detection algorithms to expose hidden kingpins and cut-point brokers.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 mb-4">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-2">Multi-Source AI Fusion</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Automated extraction of suspect entities, burner IMEIs, bank routes, and vehicles directly from unstructured FIRs, CDR tower dumps, FIU records, and surveillance logs.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 mb-4">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-2">Cryptographic Audit Chain</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Immutable SHA-256 blockchain ledger maintaining a tamper-evident chain of custody compliant with Section 65B of the Indian Evidence Act / Bharatiya Sakshya Adhiniyam (BSA).
            </p>
          </div>
        </div>

        {/* Sanskrit Motto Explanation */}
        <div className="bg-gradient-to-r from-orange-50 via-white to-emerald-50 border border-slate-200 rounded-2xl p-6 mb-10 text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-slate-500 font-mono">
            Core Philosophy
          </span>
          <h2 className="text-2xl font-extrabold text-slate-900 mt-1 font-serif">
            संबंधेषु रहस्यं, विश्लेषणे सत्यं।
          </h2>
          <p className="text-sm text-slate-700 mt-2 italic font-sans">
            "In relationships lies the mystery, in analysis lies the truth."
          </p>
          <p className="text-xs text-slate-500 mt-1 max-w-xl mx-auto">
            Traditional policing inspects isolated suspects. The Kautilya Protocol maps topological relationships to reveal systemic syndicates and strike at structural vulnerabilities.
          </p>
        </div>

        {/* Back Button */}
        <div className="text-center">
          <button
            onClick={onBackToHome}
            className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
          >
            Return to Portal Home
          </button>
        </div>
      </div>
    </div>
  );
};
