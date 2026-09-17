export type EntityType =
  | "person"
  | "organization"
  | "location"
  | "phone"
  | "vehicle"
  | "financial_account";

export type RiskLevel = "critical" | "high" | "medium" | "low";

// NEW: distinguishes different kinds of "location" entities on the map
export type LocationCategory =
  | "crime_scene"
  | "last_known_location"
  | "police_station"
  | "other";

export type RelationshipType =
  | "communicated_with"
  | "transferred_funds"
  | "co_accused"
  | "operates_front"
  | "frequents_location"
  | "uses_vehicle"
  | "subordinate_to"
  | "kinship"
  | "intercepted_meeting"
  | "linked_in_report"
  | "last_seen_at"        // NEW: person -> last_known_location
  | "near_police_station"; // NEW: crime_scene / last_known_location -> police_station

export interface EntityAttributes {
  alias?: string;
  contact?: string;
  location?: string;
  details?: string;
  criminalRecord?: string;
  accountNumber?: string;
  bankName?: string;
  vehiclePlate?: string;
  vehicleModel?: string;
  imei?: string;
  address?: string;
  [key: string]: string | undefined;
}

export interface Entity {
  id: string;
  name: string;
  type: EntityType;
  role: string;
  riskLevel: RiskLevel;
  attributes: EntityAttributes;
  confidenceScore: number;
  // Graph Analytics Properties
  degree?: number;
  betweenness?: number;
  pageRank?: number;
  community?: string;
  // D3 force layout properties
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
  // NEW: Geospatial fields — only set for entities that have a known point on the map
  // (typically type: "location", but any entity can carry coordinates, e.g. a
  // vehicle's last GPS ping or a phone's last cell-tower fix)
  latitude?: number;
  longitude?: number;
  locationCategory?: LocationCategory;
}

export interface Relationship {
  id: string;
  source: string | Entity;
  target: string | Entity;
  relationshipType: RelationshipType;
  evidenceSummary: string;
  weight: number; // 1 to 10 scale
  confidence: number; // 0.0 to 1.0
  timestamp?: string;
  sourceDocRef?: string;
  amount?: string;
  frequency?: number;
}

export interface SuspiciousPattern {
  id: string;
  patternName: string;
  severity: "critical" | "high" | "medium";
  description: string;
  involvedEntities: string[];
  detectedTimestamp: string;
  indicators: string[];
}

export interface IntelligenceSource {
  id: string;
  type: "fir" | "cdr" | "financial" | "surveillance" | "social_intel" | "criminal_history";
  title: string;
  refNo: string;
  date: string;
  rawSnippet: string;
  officer: string;
  verifiedOnBlockchain: boolean;
  blockHash?: string;
  extractedEntityCount?: number;
}

export interface AuditBlock {
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

export interface CaseData {
  caseId: string;
  caseTitle: string;
  department: string;
  division: string;
  firNumber: string;
  actsAndSections: string[];
  leadInvestigator: string;
  createdDate: string;
  status: "Active Investigation" | "Chargesheet Ready" | "Under Surveillance";
  nodes: Entity[];
  entities?: Entity[];
  links: Relationship[];
  suspiciousPatterns: SuspiciousPattern[];
  investigativeLeads: string[];
  sources: IntelligenceSource[];
}

export interface InfluencerTarget {
  id: string;
  title: string;
  influenceType: string;
  vulnerability: string;
  degreeRank: number;
  betweennessScore: number;
}