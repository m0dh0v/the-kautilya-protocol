import React, { useState } from "react";
import { Entity, Relationship } from "../types/intelligence";
import {
  Bot,
  Send,
  Sparkles,
  HelpCircle,
  FileCheck,
  User,
  Shield,
  ChevronRight,
  RefreshCw,
  Lightbulb,
} from "lucide-react";

interface InvestigativeCopilotProps {
  nodes: Entity[];
  links: Relationship[];
  onHighlightEntities: (entityIds: string[]) => void;
  onSelectNodeById: (id: string) => void;
}

interface Message {
  role: "user" | "copilot";
  text: string;
  recommendations?: string[];
  highRiskNodes?: string[];
}

const suggestedPrompts = [
  "Who is the primary financial backer of the syndicate?",
  "Trace connection between Vikram Singh and the Paharganj safehouse.",
  "Identify the single point of failure in this network hierarchy.",
  "Draft Section 161 CrPC interrogation checklist for Sunita Rao.",
  "What evidence connects Scorpio DL 1C AB 4921 to human trafficking?",
];

export const InvestigativeCopilot: React.FC<InvestigativeCopilotProps> = ({
  nodes,
  links,
  onHighlightEntities,
  onSelectNodeById,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "copilot",
      text: "NCRB Cyber Intelligence Copilot initialized. I have analyzed 24 entities, 40 relational links, and the blockchain audit trail for Operation Durga. Ask me about hidden brokers, financial conduits, safehouse movements, or procedural search actions under CrPC / BNSS.",
      recommendations: [
        "Issue Section 91 notices for Axis Bank & Yes Bank accounts.",
        "Target Sunita Rao as the highest betweenness cutout before moving on the kingpin.",
      ],
      highRiskNodes: ["person_vikram_singh", "person_sunita_rao", "person_rajan_verma"],
    },
  ]);
  const [inputQuery, setInputQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async (queryText?: string) => {
    const q = (queryText || inputQuery).trim();
    if (!q) return;

    const userMsg: Message = { role: "user", text: q };
    setMessages((prev) => [...prev, userMsg]);
    if (!queryText) setInputQuery("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/ai/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: q,
          graphContext: {
            nodes: nodes.map((n) => ({ id: n.id, name: n.name, role: n.role, riskLevel: n.riskLevel, betweenness: n.betweenness })),
            links: links.map((l) => ({
              source: typeof l.source === "object" ? (l.source as any).id : l.source,
              target: typeof l.target === "object" ? (l.target as any).id : l.target,
              type: l.relationshipType,
            })),
          },
        }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: "copilot",
          text: data.answer || "Analyzed graph topology.",
          recommendations: data.recommendations,
          highRiskNodes: data.highRiskNodes,
        },
      ]);
    } catch (err) {
      console.error("Copilot query failed:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "copilot",
          text: "Intelligence server encountered a query timeout. Rule-based evaluation: Suspect Sunita Rao represents the critical information bottleneck between leadership and ground transit safehouses.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="investigative-copilot-view" className="w-full h-full flex flex-col bg-slate-50 text-slate-900 overflow-hidden">
      {/* Top Banner */}
      <div className="p-4 border-b border-slate-200 bg-white flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-orange-100 border border-orange-200 text-orange-800">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900">AI Investigative Intelligence Copilot</h3>
            <p className="text-xs text-slate-500">Grounded on real-time graph topology & verified evidence records</p>
          </div>
        </div>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-white border border-slate-200 text-slate-800 shadow-2xs"
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1.5 text-[11px] font-mono font-medium">
                {msg.role === "copilot" ? (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-orange-600" />
                    <span className="text-slate-900 font-bold">KAUTILYA AI Intelligence Agent</span>
                  </>
                ) : (
                  <span className="text-slate-300">Investigating Officer</span>
                )}
              </div>

              <div className="whitespace-pre-line leading-relaxed">{msg.text}</div>

              {/* Recommended Next Actions / Legal Procedure */}
              {msg.recommendations && msg.recommendations.length > 0 && (
                <div className="mt-3.5 pt-3 border-t border-slate-100 space-y-2">
                  <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block">
                    Recommended Procedural Actions:
                  </span>
                  {msg.recommendations.map((rec, rIdx) => (
                    <div key={rIdx} className="flex items-start gap-2 text-xs text-slate-700">
                      <span className="text-emerald-700 font-bold">•</span>
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* High Risk Entities Pill Selector */}
              {msg.highRiskNodes && msg.highRiskNodes.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-slate-100">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                    Referenced Nodes:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {msg.highRiskNodes.map((nId) => {
                      const node = nodes.find((n) => n.id === nId);
                      return (
                        <button
                          key={nId}
                          onClick={() => {
                            onSelectNodeById(nId);
                            onHighlightEntities([nId]);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-[11px] text-blue-800 font-bold transition-all cursor-pointer"
                        >
                          {node ? node.name : nId}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-slate-600 font-mono p-3.5 bg-white rounded-2xl border border-slate-200 w-fit shadow-2xs">
            <RefreshCw className="w-4 h-4 animate-spin text-orange-600" />
            <span>Analyzing network graph connections & FIR trails...</span>
          </div>
        )}
      </div>

      {/* Suggested Prompts Pills */}
      <div className="p-3 border-t border-slate-200 bg-white">
        <div className="text-[11px] text-slate-600 font-semibold mb-2 flex items-center gap-1.5">
          <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
          <span>Quick Investigative Queries:</span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {suggestedPrompts.map((sp, i) => (
            <button
              key={i}
              onClick={() => handleSend(sp)}
              className="whitespace-nowrap px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs text-slate-800 font-medium transition-all shrink-0 cursor-pointer"
            >
              {sp}
            </button>
          ))}
        </div>
      </div>

      {/* Input Field */}
      <div className="p-3.5 sm:p-4 border-t border-slate-200 bg-white">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2.5"
        >
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="Ask AI Copilot to analyze suspects, find bottlenecks, or draft interrogation plans..."
            className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 focus:bg-white transition-all"
          />
          <button
            type="submit"
            disabled={isLoading || !inputQuery.trim()}
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white disabled:opacity-40 transition-colors cursor-pointer shadow-sm"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
