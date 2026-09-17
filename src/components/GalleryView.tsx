import React, { useState } from "react";
import { FileText, Shield, Radio, CreditCard, Car, Lock, Search, ExternalLink } from "lucide-react";

interface ExhibitItem {
  id: string;
  category: string;
  title: string;
  caseRef: string;
  date: string;
  hash: string;
  description: string;
  badge: string;
}

export const GalleryView: React.FC<{ onBackToHome: () => void }> = ({ onBackToHome }) => {
  const [activeFilter, setActiveFilter] = useState<string>("all");

  const exhibits: ExhibitItem[] = [
    {
      id: "ex_01",
      category: "cdr",
      title: "Paharganj Sector Tower Dump Triangulation",
      caseRef: "EX-CDR-2024-881",
      date: "28-Aug-2024",
      hash: "e190382710492810a9f82910482910ac7482910482910482910482910482910f",
      description: "Overlapping cell tower sectors 1042 and 1045 capturing concurrent handoffs between Sunita Rao (+91-98712-40192) and courier Amit Paswan prior to safehouse dispatch.",
      badge: "CDR Telemetry",
    },
    {
      id: "ex_02",
      category: "financial",
      title: "FIU-IND Suspicious Transaction Report: Hawala RTGS Layering",
      caseRef: "EX-FIU-STR-9081",
      date: "05-Sep-2024",
      hash: "7b40192837190284729104829104a0192837190284729104829104829104829c",
      description: "Structured banking logs detailing 38 micro-transfers of ₹49,500 each from Prerna Trust Axis Account to Rajan Verma's bullion exchange in Chandni Chowk.",
      badge: "Financial Intelligence",
    },
    {
      id: "ex_03",
      category: "surveillance",
      title: "Special Task Force Physical Reconnaissance Photographs & Logs",
      caseRef: "EX-STF-RECON-088",
      date: "06-Sep-2024",
      hash: "2a9104829104829104829104829104a9182740192837190284729104829104b",
      description: "Photographic observations of Scorpio DL 1C AB 4921 loading point outside Imperial Cinema, Paharganj, and transfer of pre-activated SIM packet.",
      badge: "Physical Recon",
    },
    {
      id: "ex_04",
      category: "forensic",
      title: "Seized Hardware IMEI Extraction: Burner SIM Swapping Cluster",
      caseRef: "EX-CFSL-IMEI-201",
      date: "07-Sep-2024",
      hash: "c89019284719283019284710293847192847192830192847192847102938471a",
      description: "Digital forensics examination revealing IMEI 864209048192004 cycled 5 burner SIM cards within 96 hours across interstate transit checkpoints.",
      badge: "Cyber Forensics",
    },
    {
      id: "ex_05",
      category: "legal",
      title: "Section 65B Bharatiya Sakshya Adhiniyam Hash Certificate",
      caseRef: "EX-CERT-BSA-001",
      date: "08-Sep-2024",
      hash: "b73fd50dfe70c77953d457ab994021f3b082e04391f618a8b1638202d0954b81",
      description: "Court-admissible certificate certifying mathematical integrity of the cryptographic chain of custody for FIR 104/2024.",
      badge: "Legal Certificate",
    },
  ];

  const filteredExhibits = activeFilter === "all" ? exhibits : exhibits.filter((e) => e.category === activeFilter);

  return (
    <div className="flex-1 w-full overflow-y-auto bg-slate-50 text-slate-900 pb-16">
      <div className="w-full h-1 bg-gradient-to-r from-[#FF9933] via-white to-[#138808]" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold uppercase tracking-wider mb-2">
              Case Evidence Repository
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Intelligence Exhibits & Forensic Gallery
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Verifiable evidentiary exhibits ingested into the Kautilya Protocol graph and anchored on the blockchain.
            </p>
          </div>

          <button
            onClick={onBackToHome}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            Back to Home
          </button>
        </div>

        {/* Filter Badges */}
        <div className="flex flex-wrap gap-2 mb-8">
          {[
            { id: "all", label: "All Exhibits" },
            { id: "cdr", label: "CDR & Tower Dumps" },
            { id: "financial", label: "FIU & Banking" },
            { id: "surveillance", label: "Surveillance Logs" },
            { id: "forensic", label: "Hardware IMEIs" },
            { id: "legal", label: "Court Certificates" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeFilter === f.id
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExhibits.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-orange-50 text-orange-700 border border-orange-200">
                    {item.badge}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">{item.date}</span>
                </div>

                <h3 className="font-bold text-sm text-slate-900 leading-snug mb-2">
                  {item.title}
                </h3>

                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  {item.description}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 mb-1.5">
                  <span>Ref: {item.caseRef}</span>
                  <span className="text-emerald-600 font-semibold flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" /> Verified
                  </span>
                </div>
                <div className="bg-slate-50 p-1.5 rounded text-[10px] font-mono text-slate-600 truncate">
                  SHA-256: {item.hash}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
