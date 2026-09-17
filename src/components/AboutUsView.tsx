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
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            About Project THE KAUTILYA PROTOCOL
          </h1>
        </div>

       <div className="space-y-8 mb-10">
          <section className="bg-gradient-to-r from-orange-50 via-white to-emerald-50 border border-slate-200 rounded-2xl p-6 sm:p-8 text-center">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-3 font-serif">
              संबंधेषु रहस्यं, विश्लेषणे सत्यं
            </h2>
            <p className="text-base sm:text-lg text-slate-700 mt-3 italic">
              "In relationships lies the mystery, in analysis lies the truth."
            </p>
          </section>

          <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 mb-4">What is the Kautilya Protocol?</h3>
            <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
              The Kautilya Protocol is an advanced, AI-powered criminal network analysis system. By ingesting multi-source intelligence—including OSINT dumps, FIR records, transit logs, and blockchain-secured data—into a dynamic graph database, the system visualizes complex, hidden relationships between entities. It transforms fragmented data into a unified, interactive map, enabling multi-agency investigators to rapidly identify, trace, and disrupt illicit networks.
            </p>
          </section>

          <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 mb-4">Ethos</h3>
            <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
              Rooted in precision, integrity, and proactive defense, we believe in empowering intelligence through data-driven clarity. Our approach relies on objective analysis, leveraging cutting-edge graph architecture, artificial intelligence, and blockchain-backed evidence integrity to uncover the truth hidden within complex data ecosystems.
            </p>
          </section>

          <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 mb-4">Mission</h3>
            <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
              To equip defense, law enforcement, and intelligence units with a scalable, AI-driven framework that accurately maps and neutralizes malicious networks before they can act.
            </p>
          </section>

          <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 mb-4">Vision</h3>
            <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
              To set the standard for next-generation intelligence analysis, fostering a secure landscape where hidden threats are systematically exposed and dismantled through advanced relational data mapping and tamper-evident digital evidence trails.
            </p>
          </section>
        </div>


        {/* Team NETRA 404 Mission Statement */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 mb-4">
              <Network className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-2">Graph Intelligence</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              We map hidden relationships across people, organizations, locations, vehicles, devices, and financial flows to reveal operational patterns that isolated records can never expose.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 mb-4">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-2">AI-Augmented Investigation</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Our system fuses structured and unstructured intelligence, automates entity extraction, and prioritizes the critical nodes and relationships most relevant to disruption and response.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 mb-4">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-2">Blockchain Integrity Layer</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Every investigation action can be anchored in an immutable SHA-256 audit trail, ensuring evidence integrity, traceability, and a tamper-evident chain of custody for criminal network analysis.
            </p>
          </div>
        </div>

         {/* Team NETRA-404 Image Section */}
        <div className="mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 text-center mb-6">
            Team NETRA 404
          </h2>
          <div className="overflow-hidden rounded-3xl border border-slate-200 shadow-md bg-white">
            <img
              src="/us.jpg"
              alt="Team NETRA 404"
              className="w-full h-[420px] object-cover object-center"
            />
          </div>
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
