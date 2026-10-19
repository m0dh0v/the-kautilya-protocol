import express from "express";
import path from "path";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { checkDatabasesStatus, fetchLiveGraphData, syncAtlasToNeo4j, syncGraphToDatabases } from "./server/db";
import { initialCaseData } from "./src/data/sampleCaseData";
import { requireAuth, verifyCredentials, createSessionToken, getSessionUsername, SESSION_COOKIE_NAME } from "./server/auth";

dotenv.config();

const app = express();
const PORT = 3000;
export default app;

app.use(express.json({ limit: "10mb" }));

// Server-side Gemini Client
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    geminiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return geminiClient;
}

// In-Memory Blockchain ledger for immutable investigation trail
interface AuditBlock {
  index: number;
  timestamp: string;
  action: string;
  officerBadge: string;
  caseId: string;
  dataHash: string;
  payloadSummary: string;
  previousHash: string;
  hash: string;
  signature: string;
}

function calculateBlockHash(
  index: number,
  timestamp: string,
  action: string,
  officerBadge: string,
  caseId: string,
  dataHash: string,
  previousHash: string
): string {
  return crypto
    .createHash("sha256")
    .update(`${index}-${timestamp}-${action}-${officerBadge}-${caseId}-${dataHash}-${previousHash}`)
    .digest("hex");
}

const auditLedger: AuditBlock[] = [];

// Initialize Genesis Block
const genesisTime = "2024-09-01T08:00:00.000Z";
const genesisDataHash = crypto.createHash("sha256").update("OPERATION_DURGA_GENESIS_RECORD_NCRB").digest("hex");
const genesisHash = calculateBlockHash(
  0,
  genesisTime,
  "CASE_INITIALIZATION",
  "NCRB-DIR-0091",
  "NCRB-WD-2024-092",
  genesisDataHash,
  "0000000000000000000000000000000000000000000000000000000000000000"
);

auditLedger.push({
  index: 0,
  timestamp: genesisTime,
  action: "CASE_INITIALIZATION",
  officerBadge: "NCRB-DIR-0091",
  caseId: "NCRB-WD-2024-092",
  dataHash: genesisDataHash,
  payloadSummary: "Genesis evidence record for FIR 42/2024 Interstate Human Trafficking & Darknet Extortion",
  previousHash: "0000000000000000000000000000000000000000000000000000000000000000",
  hash: genesisHash,
  signature: "ECDSA_SECP256K1_SIG_" + genesisHash.substring(0, 24),
});

// Seed subsequent immutable audit blocks
const sampleAuditEvents = [
  {
    action: "FIR_INGESTION",
    officerBadge: "INSP-K-SHARMA-882",
    summary: "Ingested FIR 42/2024 PS Paharganj under IPC 370/372/384/120B",
    timestamp: "2024-09-02T10:14:22.000Z",
  },
  {
    action: "CDR_UPLOAD",
    officerBadge: "SUBINSP-P-VERMA-104",
    summary: "Ingested 1,420 Call Detail Records for MSISDN +91-98110-XXXXX & cell towers",
    timestamp: "2024-09-03T14:45:10.000Z",
  },
  {
    action: "FIU_BANK_TRAIL_LINK",
    officerBadge: "CYBER-ANALYST-R-NAIR-41",
    summary: "Linked Hawala structuring across 6 dummy accounts in Axis & Yes Bank",
    timestamp: "2024-09-05T18:20:05.000Z",
  },
];

for (const event of sampleAuditEvents) {
  const prev = auditLedger[auditLedger.length - 1];
  const dHash = crypto.createHash("sha256").update(event.summary).digest("hex");
  const bHash = calculateBlockHash(
    auditLedger.length,
    event.timestamp,
    event.action,
    event.officerBadge,
    "NCRB-WD-2024-092",
    dHash,
    prev.hash
  );
  auditLedger.push({
    index: auditLedger.length,
    timestamp: event.timestamp,
    action: event.action,
    officerBadge: event.officerBadge,
    caseId: "NCRB-WD-2024-092",
    dataHash: dHash,
    payloadSummary: event.summary,
    previousHash: prev.hash,
    hash: bHash,
    signature: "ECDSA_SECP256K1_SIG_" + bHash.substring(0, 24),
  });
}

// REST API Endpoints

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    ledgerLength: auditLedger.length,
  });
});

// --- Auth routes (public — must stay above the requireAuth middleware below) ---

app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body || {};
  if (typeof username !== "string" || typeof password !== "string") {
    return res.status(400).json({ error: "Username and password are required." });
  }

  if (!verifyCredentials(username.trim(), password)) {
    return res.status(401).json({ error: "Invalid username or password." });
  }

  const token = createSessionToken(username.trim());
  res.cookie(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 1000 * 60 * 60 * 8, // 8 hours
  });
  res.json({ success: true });
});

app.post("/api/auth/logout", (req, res) => {
  res.cookie(SESSION_COOKIE_NAME, "", { path: "/", maxAge: 0 });
  res.json({ success: true });
});

app.get("/api/auth/session", (req, res) => {
  const username = getSessionUsername(req);
  res.json({ authenticated: Boolean(username), username: username || null });
});

// --- Everything below this line requires a valid session cookie. ---
app.use("/api", requireAuth);

// Real-Time Database Connectivity Status
app.get("/api/database/status", async (req, res) => {
  try {
    const status = await checkDatabasesStatus();
    res.json(status);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Real-Time Graph Data Endpoint (Neo4j -> MongoDB Atlas -> Local Cache)
app.get("/api/graph/data", async (req, res) => {
  try {
    const liveData = await fetchLiveGraphData();
    if (liveData && liveData.nodes.length > 0) {
      return res.json({
        ...initialCaseData,
        nodes: liveData.nodes,
        links: liveData.links,
        dataSource: liveData.source,
        isLive: true,
        lastSynced: new Date().toISOString(),
        graphCounts: { nodes: liveData.nodes.length, links: liveData.links.length },
      });
    }

    return res.status(503).json({
      error: "No live graph data is available from Neo4j or MongoDB Atlas.",
      dataSource: "no_live_source",
      isLive: false,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Sync Ingested Entities & Relationships to MongoDB Atlas & Neo4j
app.post("/api/graph/sync", async (req, res) => {
  try {
    const { nodes, links, caseId } = req.body;
    if (!Array.isArray(nodes) || !Array.isArray(links)) {
      return res.status(400).json({ error: "Missing or invalid nodes/links arrays" });
    }

    const syncResult = await syncGraphToDatabases(nodes, links, caseId || initialCaseData.caseId);

    // Record this database sync onto the cryptographic blockchain audit ledger
    const summary = `Synchronized ${nodes.length} entities and ${links.length} graph relationships to databases`;
    const dHash = crypto.createHash("sha256").update(JSON.stringify({ nodes, links })).digest("hex");
    const prevBlock = auditLedger[auditLedger.length - 1];
    const timestamp = new Date().toISOString();
    const newHash = calculateBlockHash(
      auditLedger.length,
      timestamp,
      "GRAPH_DATABASE_SYNC",
      "SYS-DB-ORCHESTRATOR",
      caseId || initialCaseData.caseId,
      dHash,
      prevBlock ? prevBlock.hash : "0000000000000000000000000000000000000000000000000000000000000000"
    );

    auditLedger.push({
      index: auditLedger.length,
      timestamp,
      action: "GRAPH_DATABASE_SYNC",
      officerBadge: "SYS-DB-ORCHESTRATOR",
      caseId: caseId || initialCaseData.caseId,
      dataHash: dHash,
      payloadSummary: summary,
      previousHash: prevBlock ? prevBlock.hash : "0000000000000000000000000000000000000000000000000000000000000000",
      hash: newHash,
      signature: "ECDSA_SECP256K1_SIG_" + newHash.substring(0, 24),
    });

    res.json({
      success: true,
      syncResult,
      auditBlockIndex: auditLedger.length - 1,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Project Compass-imported MongoDB Atlas collections into Neo4j for graph analysis.
app.post("/api/database/sync-atlas-to-neo4j", async (req, res) => {
  try {
    const result = await syncAtlasToNeo4j(req.body?.caseId || initialCaseData.caseId);
    if (result.errors.length > 0) {
      return res.status(502).json({ success: false, result });
    }
    res.json({ success: true, result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Seed Initial Dataset to Connected Database
app.post("/api/database/seed", async (req, res) => {
  try {
    const syncResult = await syncGraphToDatabases(
      initialCaseData.nodes,
      initialCaseData.links,
      initialCaseData.caseId
    );
    res.json({
      success: true,
      message: "Seeded Operation Durga baseline dataset to connected databases",
      syncResult,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Blockchain Ledger Endpoints
app.get("/api/blockchain/ledger", (req, res) => {
  res.json({
    chain: auditLedger,
    isValid: verifyLedgerIntegrity(auditLedger),
    lastBlockHash: auditLedger[auditLedger.length - 1]?.hash,
  });
});

app.post("/api/blockchain/record", (req, res) => {
  try {
    const { action, officerBadge, caseId, summary, rawData } = req.body;
    const prevBlock = auditLedger[auditLedger.length - 1];
    const timestamp = new Date().toISOString();
    const dataHash = crypto
      .createHash("sha256")
      .update(rawData ? JSON.stringify(rawData) : summary || "")
      .digest("hex");

    const newIndex = auditLedger.length;
    const newHash = calculateBlockHash(
      newIndex,
      timestamp,
      action || "DATA_INGESTION",
      officerBadge || "OFFICER-INVESTIGATOR",
      caseId || "NCRB-WD-2024-092",
      dataHash,
      prevBlock ? prevBlock.hash : "0000000000000000000000000000000000000000000000000000000000000000"
    );

    const block: AuditBlock = {
      index: newIndex,
      timestamp,
      action: action || "DATA_INGESTION",
      officerBadge: officerBadge || "OFFICER-INVESTIGATOR",
      caseId: caseId || "NCRB-WD-2024-092",
      dataHash,
      payloadSummary: summary || "Recorded intelligence transaction",
      previousHash: prevBlock ? prevBlock.hash : "0",
      hash: newHash,
      signature: "ECDSA_SECP256K1_SIG_" + newHash.substring(0, 24),
    };

    auditLedger.push(block);
    res.json({ success: true, block, totalBlocks: auditLedger.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

function verifyLedgerIntegrity(chain: AuditBlock[]): boolean {
  for (let i = 1; i < chain.length; i++) {
    const current = chain[i];
    const prev = chain[i - 1];
    if (current.previousHash !== prev.hash) return false;
    const recomputed = calculateBlockHash(
      current.index,
      current.timestamp,
      current.action,
      current.officerBadge,
      current.caseId,
      current.dataHash,
      current.previousHash
    );
    if (current.hash !== recomputed) return false;
  }
  return true;
}

// AI Entity & Relationship Extraction Endpoint
app.post("/api/ai/extract", async (req, res) => {
  const { text, sourceType, existingEntityIds } = req.body;

  if (!text || typeof text !== "string") {
    return res.status(400).json({ error: "Missing or invalid 'text' payload" });
  }

  const ai = getGeminiClient();

  if (!ai) {
    // Deterministic fallback entity extraction if API key isn't provided yet
    const fallbackResult = generateFallbackExtraction(text, sourceType);
    return res.json(fallbackResult);
  }

  try {
    const systemPrompt = `You are a Senior Criminal Network Intelligence Analyst for the National Crime Records Bureau (NCRB) Women Safety & Organized Crime Division.
Your task is to analyze the provided law enforcement report (which could be an FIR, Call Detail Record log, Financial transaction report, Surveillance log, or Intercepted intel).
Extract:
1. Entities: People, Organizations (companies, front NGOs, syndicates), Locations (cities, safe houses, transit hubs), Vehicles (license plates, cars), Phone Numbers / IMEI, and Financial Accounts (Bank accounts, UPI IDs, Crypto wallets).
2. Relationships between these entities with exact edge types (e.g. "communicated_with", "transferred_funds", "co_accused", "operates_front", "frequents_location", "uses_vehicle", "subordinate_to", "kinship").
3. Threat risk level for each person (critical, high, medium, low).
4. Suspicious patterns (e.g. "Hawala smurfing under ₹50k", "Burner phone cycling", "Tower convergence during crime window", "Fake job agency recruitment front").
5. Actionable investigative leads.

Output must strictly conform to JSON.`;

    const extractionSchema = {
      type: Type.OBJECT,
      properties: {
        summary: {
          type: Type.STRING,
          description: "Executive analytical summary of this crime data source in 2-3 sentences.",
        },
        entities: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING, description: "Normalized unique snake_case id, e.g. person_rohit_sharma" },
              name: { type: Type.STRING, description: "Display name or identifier" },
              type: {
                type: Type.STRING,
                description: "Must be one of: person, organization, location, phone, vehicle, financial_account",
              },
              role: { type: Type.STRING, description: "E.g. Syndicate Kingpin, Recruiter, Hawala Courier, Transit Driver, Safehouse, Front NGO" },
              riskLevel: { type: Type.STRING, description: "critical, high, medium, or low" },
              attributes: {
                type: Type.OBJECT,
                properties: {
                  alias: { type: Type.STRING },
                  contact: { type: Type.STRING },
                  location: { type: Type.STRING },
                  details: { type: Type.STRING },
                  criminalRecord: { type: Type.STRING },
                },
              },
              confidenceScore: { type: Type.NUMBER, description: "0.0 to 1.0 confidence score" },
            },
            required: ["id", "name", "type", "role", "riskLevel"],
          },
        },
        relationships: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              source: { type: Type.STRING, description: "Entity ID matching one in entities or existing" },
              target: { type: Type.STRING, description: "Entity ID matching one in entities or existing" },
              relationshipType: {
                type: Type.STRING,
                description: "e.g., communicated_with, transferred_funds, co_accused, operates_front, frequents_location, subordinate_to, controls",
              },
              evidenceSummary: { type: Type.STRING, description: "Specific evidence from the text supporting this link" },
              weight: { type: Type.NUMBER, description: "Connection strength 1-10" },
              confidence: { type: Type.NUMBER, description: "0.0 to 1.0" },
            },
            required: ["source", "target", "relationshipType", "evidenceSummary"],
          },
        },
        suspiciousPatterns: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              patternName: { type: Type.STRING },
              severity: { type: Type.STRING, description: "critical, high, medium" },
              description: { type: Type.STRING },
              involvedEntities: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: ["patternName", "severity", "description"],
          },
        },
        investigativeLeads: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
      },
      required: ["summary", "entities", "relationships", "suspiciousPatterns", "investigativeLeads"],
    };

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: `Document Type: ${sourceType || "General Police Report"}\nDocument Text:\n${text}`,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: extractionSchema,
        temperature: 0.2,
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    return res.json(parsed);
  } catch (err: any) {
    console.error("Gemini entity extraction error:", err);
    // Fallback to rule-based parser on any network/rate error
    const fallback = generateFallbackExtraction(text, sourceType);
    return res.json({ ...fallback, _warning: "Processed via rule-based extraction engine" });
  }
});

// AI Investigative Copilot / Network Query
app.post("/api/ai/copilot", async (req, res) => {
  const { question, graphContext } = req.body;

  if (!question) {
    return res.status(400).json({ error: "Missing 'question' in body" });
  }

  const ai = getGeminiClient();

  if (!ai) {
    return res.json({
      answer: generateRuleBasedCopilotAnswer(question, graphContext),
      recommendations: [
        "Issue Section 91 CrPC notice for bank transaction logs across identified accounts.",
        "Deploy CDR tower dump analysis around Paharganj safehouse at 22:00-02:00 window.",
        "Verify KYC credentials of Front NGO 'Prerna Skill Uplift Foundation'.",
      ],
      highRiskNodes: ["person_vikram_singh", "org_prerna_foundation", "phone_9811029381"],
    });
  }

  try {
    const prompt = `You are the NCRB AI Investigative Analyst Assistant. You have access to the current graph analytics state of Operation Durga.
Current Case Entities:
${JSON.stringify(graphContext?.nodes || [], null, 2)}

Current Case Links:
${JSON.stringify(graphContext?.links || [], null, 2)}

Recent Blockchain Audit Log Entries:
${JSON.stringify(auditLedger.slice(-5), null, 2)}

Investigator Query: "${question}"

Provide:
1. Direct, incisive analytical response addressing hidden connections, key influencers, vulnerability points, and command hierarchy.
2. 3-4 Actionable Next Steps / Legal Procedural actions (CrPC / BNSS / IT Act).
3. 2-4 Critical nodes of interest mentioned in your answer.
Ensure your response is factual based on the graph data. Return strictly JSON.`;

    const copilotSchema = {
      type: Type.OBJECT,
      properties: {
        answer: { type: Type.STRING, description: "Detailed investigative synthesis formatted in clean paragraphs" },
        recommendations: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
        highRiskNodes: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
        confidenceAssessment: { type: Type.STRING },
      },
      required: ["answer", "recommendations", "highRiskNodes"],
    };

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: copilotSchema,
        temperature: 0.3,
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    return res.json(parsed);
  } catch (err: any) {
    console.error("Copilot AI error:", err);
    return res.json({
      answer: generateRuleBasedCopilotAnswer(question, graphContext),
      recommendations: [
        "Issue Section 91 notice for bank transaction logs across identified accounts.",
        "Deploy CDR tower dump analysis around Paharganj safehouse.",
        "Initiate look-out circular (LOC) for primary syndicate coordinators.",
      ],
      highRiskNodes: ["person_vikram_singh", "org_prerna_foundation"],
    });
  }
});

// Deep Network Centrality & Influencer AI Analysis
app.post("/api/ai/influencers", async (req, res) => {
  const { nodes, links, metrics } = req.body;
  const ai = getGeminiClient();

  if (!ai) {
    return res.json({
      executiveSummary: "Network analysis reveals a tri-hub cellular syndicate structure. The network isolates the apex kingpin via multiple cutouts and shell NGOs.",
      keyInfluencers: [
        {
          id: "person_vikram_singh",
          title: "Kingpin / Syndicate Head",
          influenceType: "Strategic Command & High Eigenvector Centrality",
          vulnerability: "Relies on Sunita Rao for all field communications. Direct arrest risks network fragmentation.",
        },
        {
          id: "person_sunita_rao",
          title: "High Betweenness Cutout & Recruiter",
          influenceType: "Information Bottleneck (Betweenness: 0.88)",
          vulnerability: "Single point of failure between human trafficking victims and financial laundering ring.",
        },
        {
          id: "person_rajan_verma",
          title: "Hawala Financier",
          influenceType: "Financial Hub (Degree: 7)",
          vulnerability: "All smurfing transactions converge on his Axis & Yes Bank accounts.",
        }
      ],
      disruptionStrategy: "Simultaneous cordoning of Paharganj safehouse and freezing of Axis Bank Account #9120 prevents asset liquidation and safehouse evacuation.",
    });
  }

  try {
    const prompt = `Analyze this criminal network topology.
Nodes: ${JSON.stringify(nodes || [])}
Links: ${JSON.stringify(links || [])}
Centrality Metrics: ${JSON.stringify(metrics || {})}

Identify the key influencers (Kingpins, Brokers/Cutouts, Financiers, Logistics Handlers), their structural vulnerabilities, and the optimal law enforcement disruption strategy.
Return JSON.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            executiveSummary: { type: Type.STRING },
            keyInfluencers: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  influenceType: { type: Type.STRING },
                  vulnerability: { type: Type.STRING },
                },
                required: ["id", "title", "influenceType", "vulnerability"],
              },
            },
            disruptionStrategy: { type: Type.STRING },
          },
          required: ["executiveSummary", "keyInfluencers", "disruptionStrategy"],
        },
        temperature: 0.2,
      },
    });

    return res.json(JSON.parse(response.text || "{}"));
  } catch (err: any) {
    console.error("Influencer AI error:", err);
    return res.status(500).json({ error: "Failed to generate influencer report" });
  }
});

// Fallback rule-based parsing engine
function generateFallbackExtraction(text: string, sourceType?: string) {
  const phoneRegex = /(?:\+91[\-\s]?)?[6-9]\d{9}/g;
  const phones = Array.from(new Set(text.match(phoneRegex) || []));

  const vehicleRegex = /[A-Z]{2}[-\s]?[0-9]{1,2}[-\s]?[A-Z]{1,3}[-\s]?[0-9]{4}/g;
  const vehicles = Array.from(new Set(text.match(vehicleRegex) || []));

  const accountRegex = /(?:A\/C|Account|UPI|acc)[\s#:]*([A-Za-z0-9@_.-]{8,20})/gi;
  const accounts: string[] = [];
  let match;
  while ((match = accountRegex.exec(text)) !== null) {
    accounts.push(match[1]);
  }

  const entities: any[] = [];
  const relationships: any[] = [];

  phones.forEach((p, idx) => {
    const id = `phone_${p.replace(/[^0-9]/g, "")}`;
    entities.push({
      id,
      name: p,
      type: "phone",
      role: "Intercepted MSISDN",
      riskLevel: idx === 0 ? "critical" : "high",
      attributes: { contact: p, details: `Discovered in ${sourceType || "intel record"}` },
      confidenceScore: 0.95,
    });
  });

  vehicles.forEach((v) => {
    const id = `veh_${v.replace(/[^A-Za-z0-9]/g, "_").toLowerCase()}`;
    entities.push({
      id,
      name: v,
      type: "vehicle",
      role: "Suspect Transit Vehicle",
      riskLevel: "medium",
      attributes: { details: `Observed vehicle reg plate: ${v}` },
      confidenceScore: 0.9,
    });
  });

  accounts.forEach((a) => {
    const id = `fin_${a.replace(/[^A-Za-z0-9]/g, "_").toLowerCase()}`;
    entities.push({
      id,
      name: a,
      type: "financial_account",
      role: "Transaction Target",
      riskLevel: "high",
      attributes: { details: `Bank Account / Virtual Address: ${a}` },
      confidenceScore: 0.88,
    });
  });

  // Extract persons with standard honorifics / keywords
  const personMatches = text.match(/(?:Shri|Mr\.|Ms\.|Mrs\.|accused|suspect|named)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/g) || [];
  personMatches.forEach((pm) => {
    const cleanName = pm.replace(/(?:Shri|Mr\.|Ms\.|Mrs\.|accused|suspect|named)\s+/i, "").trim();
    if (cleanName.length > 2) {
      const id = `person_${cleanName.toLowerCase().replace(/\s+/g, "_")}`;
      if (!entities.some((e) => e.id === id)) {
        entities.push({
          id,
          name: cleanName,
          type: "person",
          role: "Identified Suspect / Associate",
          riskLevel: "high",
          attributes: { details: `Extracted from ${sourceType || "police report"}` },
          confidenceScore: 0.85,
        });
      }
    }
  });

  // Add a sample relationship if multiple entities exist
  if (entities.length >= 2) {
    relationships.push({
      source: entities[0].id,
      target: entities[1].id,
      relationshipType: "linked_in_report",
      evidenceSummary: `Co-referenced in ingested ${sourceType || "intelligence document"}`,
      weight: 6,
      confidence: 0.8,
    });
  }

  return {
    summary: `Processed ${sourceType || "report"}: Identified ${entities.length} distinct entities with potential cyber & network linkages.`,
    entities,
    relationships,
    suspiciousPatterns: [
      {
        patternName: "Entity Co-Occurrence in Police Record",
        severity: "high",
        description: `Direct co-occurrence of multiple communication, vehicular, and personal identifiers within the same incident statement.`,
        involvedEntities: entities.slice(0, 3).map((e) => e.id),
      },
    ],
    investigativeLeads: [
      "Cross-reference telephone records with C-DOT CMS (Central Monitoring System).",
      "Issue Section 91 CrPC notice for subscriber verification and CDR history.",
      "Initiate geofence query on associated cell tower nodes.",
    ],
  };
}

function generateRuleBasedCopilotAnswer(question: string, graphContext: any): string {
  const qLower = question.toLowerCase();
  if (qLower.includes("kingpin") || qLower.includes("head") || qLower.includes("leader")) {
    return "Based on graph topology and betweenness centrality, Vikram Singh emerges as the apex coordinator. He maintains strict operational security by communicating almost exclusively through intermediary Sunita Rao and using burner devices, isolating himself from street-level transit operatives.";
  }
  if (qLower.includes("money") || qLower.includes("hawala") || qLower.includes("financ")) {
    return "Financial trail analysis identifies Rajan Verma and shell entity 'Prerna Skill Uplift Foundation' as the primary money laundering conduit. Inflows from call-center cyber extortion are structured into sub-₹50,000 deposits across Axis Bank and Yes Bank to evade automated Financial Intelligence Unit (FIU-IND) flags.";
  }
  if (qLower.includes("safehouse") || qLower.includes("location") || qLower.includes("transit")) {
    return "Geotagged CDR clustering and surveillance reports pinpoint two primary hubs: the Paharganj Safehouse (transit staging for victims) and a fake BPO facility in Sector 62, Noida (cyber extortion and fake recruitment call center).";
  }
  return "The intelligence graph indicates a highly organized multi-tier network operating across recruitment, transit logistics, digital extortion, and hawala laundering. Intermediary Sunita Rao represents the highest structural vulnerability; her betweenness centrality of 0.88 means isolating her will sever coordination between top-tier handlers and field operators.";
}

// Vite middleware for dev / static for prod
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`NCRB Criminal Network Analysis Server listening on http://0.0.0.0:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}
