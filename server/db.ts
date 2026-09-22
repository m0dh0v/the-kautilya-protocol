import { MongoClient, Db } from "mongodb";
import neo4j, { Driver, Session } from "neo4j-driver";

// Singleton Database Clients
let mongoClient: MongoClient | null = null;
let mongoDbInstance: Db | null = null;
let neo4jDriverInstance: Driver | null = null;

// In-memory cache for live data pushed directly by partner's local agent script
interface PartnerBridgeData {
  nodes: any[];
  links: any[];
  lastSync: string;
  sourceDevice?: string;
  partnerMongoConnected?: boolean;
  partnerNeo4jConnected?: boolean;
}

let partnerLiveCache: PartnerBridgeData | null = null;

export function savePartnerBridgeData(data: {
  nodes: any[];
  links: any[];
  sourceDevice?: string;
  partnerMongoConnected?: boolean;
  partnerNeo4jConnected?: boolean;
}) {
  partnerLiveCache = {
    nodes: data.nodes,
    links: data.links,
    lastSync: new Date().toISOString(),
    sourceDevice: data.sourceDevice || "Partner Local Machine",
    partnerMongoConnected: data.partnerMongoConnected ?? true,
    partnerNeo4jConnected: data.partnerNeo4jConnected ?? true,
  };
  return partnerLiveCache;
}

export function getPartnerBridgeData(): PartnerBridgeData | null {
  return partnerLiveCache;
}

function normalizeEntityType(properties: any, labels: string[] = []): string {
  const raw = String(
    properties?.type ||
    properties?.entityType ||
    properties?.entity_type ||
    properties?.category ||
    properties?.kind ||
    labels.find((label) => label.toLowerCase() !== "entity") ||
    ""
  ).toLowerCase().replace(/[\s-]+/g, "_");

  if (raw.includes("phone") || raw.includes("mobile") || raw.includes("imei")) return "phone";
  if (raw.includes("vehicle") || raw.includes("car") || raw.includes("auto")) return "vehicle";
  if (raw.includes("camera") || raw.includes("location") || raw.includes("station") || raw.includes("place")) return "location";
  if (raw.includes("upi") || raw.includes("bank") || raw.includes("account") || raw.includes("wallet") || raw.includes("financial")) return "financial_account";
  if (raw.includes("org") || raw.includes("company") || raw.includes("agency")) return "organization";

  const searchable = JSON.stringify({
    role: properties?.role,
    name: properties?.name || properties?.label || properties?.title,
    attributes: properties?.attributes,
    phone: properties?.phone || properties?.mobile || properties?.phoneNumber,
    imei: properties?.imei,
    vehicle: properties?.vehicle || properties?.vehiclePlate || properties?.registrationNumber,
    account: properties?.account || properties?.accountNumber || properties?.bankName || properties?.upiId,
    organization: properties?.organization || properties?.company || properties?.agency,
    latitude: properties?.latitude,
    longitude: properties?.longitude,
  }).toLowerCase();

  if (/phone|mobile|imei|sim|msisdn/.test(searchable)) return "phone";
  if (/vehicle|car|auto|plate|registration/.test(searchable)) return "vehicle";
  if (/bank|account|wallet|upi|financial|ifsc|transaction/.test(searchable)) return "financial_account";
  if (/organization|company|agency|corporation|group/.test(searchable)) return "organization";
  if (/location|station|address|latitude|longitude|place/.test(searchable)) return "location";
  return "person";
}

function normalizeLiveEntity(node: any): any {
  const attributes = node?.attributes && typeof node.attributes === "object" ? node.attributes : {};
  const properties = { ...node, attributes };
  return {
    ...node,
    id: node.id || String(node._id || node.identity),
    name: node.name || node.label || node.title || node.value || node.id || "Unknown entity",
    type: normalizeEntityType(properties, Array.isArray(node.labels) ? node.labels : []),
    role: node.role || node.description || "Entity",
    riskLevel: ["critical", "high", "medium", "low"].includes(String(node.riskLevel).toLowerCase())
      ? String(node.riskLevel).toLowerCase()
      : "medium",
    attributes,
    confidenceScore: Number(node.confidenceScore ?? node.confidence ?? 0.9),
  };
}

function normalizeNeo4jEntity(node: any): any {
  const properties = node?.properties || {};
  const labels = Array.isArray(node?.labels) ? node.labels : [];
  const id = String(properties.id || properties.uid || properties.identifier || node.identity);
  let attributes = properties.attributes || {};
  if (typeof attributes === "string") {
    try {
      attributes = JSON.parse(attributes);
    } catch {
      attributes = { details: attributes };
    }
  }

  return {
    id,
    name: String(properties.name || properties.label || properties.title || properties.value || id),
    type: normalizeEntityType(properties, labels),
    role: String(properties.role || properties.description || labels.join(" / ") || "Entity"),
    riskLevel: ["critical", "high", "medium", "low"].includes(String(properties.riskLevel).toLowerCase())
      ? String(properties.riskLevel).toLowerCase()
      : "medium",
    attributes,
    confidenceScore: Number(properties.confidenceScore ?? properties.confidence ?? 0.9),
    latitude: Number.isFinite(Number(properties.latitude)) ? Number(properties.latitude) : undefined,
    longitude: Number.isFinite(Number(properties.longitude)) ? Number(properties.longitude) : undefined,
    locationCategory: properties.locationCategory,
    sourceLabels: labels,
  };
}

/**
 * Lazy-load MongoDB Client (Supports local mongod over tunnel or cloud Atlas)
 */
export async function getMongoDb(): Promise<Db | null> {
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) {
    return null;
  }

  if (mongoDbInstance) {
    return mongoDbInstance;
  }

  try {
    if (!mongoClient) {
      const isStandalone = uri.startsWith("mongodb://") && !uri.includes("replicaSet");
      mongoClient = new MongoClient(uri, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 10000,
        directConnection: isStandalone ? true : undefined,
      });
      await mongoClient.connect();
    }
    const configuredDatabase = process.env.MONGODB_DATABASE?.trim();
    let uriDatabase = "";
    try {
      uriDatabase = new URL(uri).pathname.replace(/^\//, "");
    } catch {
      // Fall back to the default when the URI is not URL-parseable.
    }
    mongoDbInstance = mongoClient.db(configuredDatabase || uriDatabase || "kautilya_db");
    return mongoDbInstance;
  } catch (err: any) {
    console.warn("MongoDB connection attempt failed:", err.message);
    mongoClient = null;
    mongoDbInstance = null;
    return null;
  }
}

/**
 * Lazy-load Neo4j Graph Driver
 */
export function getNeo4jDriver(): Driver | null {
  const uri = process.env.NEO4J_URI?.trim();
  const username = process.env.NEO4J_USERNAME?.trim() || "neo4j";
  const password = process.env.NEO4J_PASSWORD?.trim();

  if (!uri || !password) {
    return null;
  }

  if (neo4jDriverInstance) {
    return neo4jDriverInstance;
  }

  try {
    neo4jDriverInstance = neo4j.driver(
      uri,
      neo4j.auth.basic(username, password),
      {
        maxConnectionLifetime: 3 * 60 * 60 * 1000, // 3 hours
        maxConnectionPoolSize: 50,
        connectionAcquisitionTimeout: 5000,
      }
    );
    return neo4jDriverInstance;
  } catch (err: any) {
    console.warn("Neo4j driver initialization failed:", err.message);
    neo4jDriverInstance = null;
    return null;
  }
}

export interface DatabaseStatus {
  mongodb: {
    configured: boolean;
    connected: boolean;
    databaseName?: string;
    collections?: string[];
    error?: string;
    entityCount?: number;
  };
  neo4j: {
    configured: boolean;
    connected: boolean;
    uri?: string;
    error?: string;
    nodeCount?: number;
    relationshipCount?: number;
  };
  partnerBridge?: {
    connected: boolean;
    lastSync?: string;
    nodeCount?: number;
    linkCount?: number;
    sourceDevice?: string;
    partnerMongoConnected?: boolean;
    partnerNeo4jConnected?: boolean;
  };
  activeMode: "partner_bridge_live" | "neo4j_live" | "mongodb_live" | "hybrid_live" | "fallback_sample";
}

/**
 * Check live connection health for MongoDB and Neo4j
 */
export async function checkDatabasesStatus(): Promise<DatabaseStatus> {
  const status: DatabaseStatus = {
    mongodb: {
      configured: Boolean(process.env.MONGODB_URI),
      connected: false,
    },
    neo4j: {
      configured: Boolean(process.env.NEO4J_URI && process.env.NEO4J_PASSWORD),
      connected: false,
    },
    activeMode: "fallback_sample",
  };

  // Check Partner Bridge Data
  if (partnerLiveCache) {
    status.partnerBridge = {
      connected: true,
      lastSync: partnerLiveCache.lastSync,
      nodeCount: partnerLiveCache.nodes.length,
      linkCount: partnerLiveCache.links.length,
      sourceDevice: partnerLiveCache.sourceDevice,
      partnerMongoConnected: partnerLiveCache.partnerMongoConnected,
      partnerNeo4jConnected: partnerLiveCache.partnerNeo4jConnected,
    };
  }

  // Test MongoDB
  if (status.mongodb.configured) {
    try {
      const db = await getMongoDb();
      if (db) {
        // Run ping command
        await db.command({ ping: 1 });
        const collections = await db.listCollections().toArray();
        const entityCount = await db.collection("entities").countDocuments();

        status.mongodb.connected = true;
        status.mongodb.databaseName = db.databaseName;
        status.mongodb.collections = collections.map((c) => c.name);
        status.mongodb.entityCount = entityCount;
      }
    } catch (err: any) {
      status.mongodb.error = err.message;
    }
  }

  // Test Neo4j
  if (status.neo4j.configured) {
    try {
      const driver = getNeo4jDriver();
      if (driver) {
        await driver.verifyConnectivity();
        const session = driver.session();
        try {
          const countResult = await session.run(`
            MATCH (n)
            RETURN count(n) AS nodeCount
          `);
          const relResult = await session.run(`
            MATCH ()-[r]->()
            RETURN count(r) AS relCount
          `);

          const nodeCount = countResult.records[0]?.get("nodeCount")?.toNumber() ?? 0;
          const relCount = relResult.records[0]?.get("relCount")?.toNumber() ?? 0;

          status.neo4j.connected = true;
          status.neo4j.uri = process.env.NEO4J_URI;
          status.neo4j.nodeCount = nodeCount;
          status.neo4j.relationshipCount = relCount;
        } finally {
          await session.close();
        }
      }
    } catch (err: any) {
      status.neo4j.error = err.message;
    }
  }

  if (partnerLiveCache && (partnerLiveCache.nodes.length > 0 || partnerLiveCache.links.length > 0)) {
    status.activeMode = "partner_bridge_live";
  } else if (status.neo4j.connected && status.mongodb.connected) {
    status.activeMode = "hybrid_live";
  } else if (status.neo4j.connected) {
    status.activeMode = "neo4j_live";
  } else if (status.mongodb.connected) {
    status.activeMode = "mongodb_live";
  } else {
    status.activeMode = "fallback_sample";
  }

  return status;
}

/**
 * Fetch Graph topology directly from Partner Bridge, Neo4j, or MongoDB
 */
function slugify(value: string | undefined | null): string {
  return String(value || "unknown")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 80) || "unknown";
}

function buildBombDataGraph(docs: any[]): { nodes: any[]; links: any[] } {
  const nodeMap = new Map<string, any>();
  const links: any[] = [];

  const numericValue = (value: any): number => {
    const parsed = Number(String(value ?? "").replace(/[^0-9.-]/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const addNode = (id: string, name: string, type: string, role: string, riskLevel: string, attributes: Record<string, any> = {}, confidenceScore = 0.9) => {
    if (!id || nodeMap.has(id)) return;
    nodeMap.set(id, {
      id,
      name,
      type,
      role,
      riskLevel,
      attributes,
      confidenceScore,
    });
  };

  const addLink = (source: string, target: string, relationshipType: string, evidenceSummary: string, weight = 6, confidence = 0.9) => {
    if (!source || !target || source === target) return;
    links.push({
      id: `rel_${source}_${target}_${relationshipType}_${links.length}`,
      source,
      target,
      relationshipType,
      evidenceSummary,
      weight,
      confidence,
    });
  };

  docs.forEach((doc, index) => {
    const caseId = doc.caseId || doc["CASE ID"] || `bomb_case_${index + 1}`;
    const eventId = `bomb_event_${slugify(caseId)}_${index + 1}`;
    const eventLabel = doc.title || doc.eventName || `Bomb Incident ${index + 1}`;
    const place = doc.LOCATION || doc.location || doc.PLACE || doc.place || "Unknown location";
    const district = doc.DISTRICT || doc.district || "Unknown district";
    const state = doc.STATE || doc.state || "Unknown state";
    const date = doc.DATE || doc.date || doc.timestamp || "Unknown date";
    const sourceLabel = doc.SOURCE || doc.source || "Public intelligence source";
    const targetValue = doc.TARGET || doc.target || doc["TARGET TYPE"] || "Unknown target";
    const device = doc.DEVICE || doc.device || doc["DEVICE TYPE"] || "Unknown device";
    const explosive = doc.EXPLOSIVE || doc.explosive || doc["EXPLOSIVE TYPE"] || "Unknown explosive";
    const terroristGroup = doc["TERRORIST GP"] || doc.terroristGroup || doc.terrorist || "Unknown group";
    const associatedNetwork = doc.PERSON || doc.person || doc.PERPETRATOR || doc.perpetrator || terroristGroup;
    const latitude = numericValue(doc.LATITUDE || doc.latitude);
    const longitude = numericValue(doc.LONGITUDE || doc.longitude);
    const casualties = numericValue(doc["SF KILLED"]) + numericValue(doc["CIV KILLED"]);
    const injuries = numericValue(doc["SF INJURED"]) + numericValue(doc["CIV INJURED"]);
    const criticality = casualties >= 10 || injuries >= 50 ? "critical" : casualties > 0 || injuries > 0 ? "high" : "medium";

    addNode(eventId, eventLabel, "event", "Explosive Attack", "critical", {
      caseId,
      date,
      location: place,
      district,
      state,
      source: sourceLabel,
      summary: doc["INCIDENT IN BRIEF"] || doc.description || doc.summary || "Bomb incident record",
    }, 0.98);

    const locationId = `location_${slugify(place)}`;
    addNode(locationId, place, "location", "Blast Site", criticality, {
      district,
      state,
      latitude,
      longitude,
      criticality,
      casualties,
      injuries,
      associatedNetwork,
      source: sourceLabel,
    }, 0.94);
    const locationNode = nodeMap.get(locationId);
    if (locationNode) {
      const previousNetwork = locationNode.attributes.associatedNetwork;
      locationNode.attributes.associatedNetwork = Array.from(
        new Set([previousNetwork, associatedNetwork].filter((value) => value && value !== "Unknown group"))
      ).join(" | ");
    }
    if (locationNode && latitude !== 0 && longitude !== 0) {
      locationNode.latitude = latitude;
      locationNode.longitude = longitude;
      locationNode.locationCategory = "crime_scene";
    }
    addLink(eventId, locationId, "occurred_at", `Bomb incident recorded at ${place}.`, 9, 0.97);

    if (targetValue) {
      const targetId = `target_${slugify(targetValue)}`;
      addNode(targetId, targetValue, "organization", "Targeted Asset", "high", { category: "strategic target" }, 0.9);
      addLink(eventId, targetId, "targeted", `Explosive event targeted ${targetValue}.`, 8, 0.92);
    }

    if (device) {
      const deviceId = `device_${slugify(device)}`;
      addNode(deviceId, device, "vehicle", "IED / Explosive Device", "high", { category: "explosive device" }, 0.88);
      addLink(eventId, deviceId, "used_device", `The incident used ${device}.`, 7, 0.91);
    }

    if (explosive) {
      const explosiveId = `explosive_${slugify(explosive)}`;
      addNode(explosiveId, explosive, "financial_account", "Explosive Material", "medium", { category: "hazardous material" }, 0.84);
      addLink(eventId, explosiveId, "used_material", `Recovered or documented explosive material: ${explosive}.`, 6, 0.88);
    }

    if (terroristGroup && terroristGroup !== "Unknown group") {
      const groupId = `group_${slugify(terroristGroup)}`;
      addNode(groupId, terroristGroup, "organization", "Suspicious Group", "critical", { category: "terrorist network" }, 0.92);
      addLink(eventId, groupId, "linked_to_group", `Bomb incident is associated with ${terroristGroup}.`, 8, 0.94);
    }
  });

  return {
    nodes: Array.from(nodeMap.values()),
    links,
  };
}

const DAWOOD_LOCATION_COORDINATES: Record<string, [number, number]> = {
  "Delhi Connaught Place": [28.6315, 77.2167],
  "Delhi Karol Bagh": [28.6519, 77.1909],
  "Dubai Airport": [25.2532, 55.3657],
  "Dubai Gold Souk": [25.2854, 55.2972],
  "Dubai Hills": [25.1086, 55.2456],
  "Dubai JLT": [25.0674, 55.1419],
  "Dubai Marina": [25.0805, 55.1403],
  "Dubai Port": [25.2697, 55.2797],
  "Karachi Clifton": [24.8138, 67.0305],
  "Karachi": [24.8607, 67.0011],
  "Karachi Port": [24.7995, 66.9748],
  "Mumbai Andheri": [19.1197, 72.8468],
  "Mumbai Bandra": [19.0607, 72.8362],
  "Mumbai Central": [18.9696, 72.8194],
  "Mumbai Dadar": [19.0178, 72.8478],
  "Mumbai Lower Parel": [18.9988, 72.8258],
  "Mumbai Powai": [19.1176, 72.9060],
};

function normalizeDawoodLocation(value: string): string {
  const trimmed = value.replace(/^GN-[A-Za-z0-9]+\s+/, "").trim();
  if (trimmed === "Delhi") return "Delhi Connaught Place";
  if (trimmed === "Karachi") return "Karachi";
  if (trimmed === "Karachi Port") return "Karachi Port";
  return trimmed;
}

function buildDawoodLocationGraph(
  people: any[],
  telecom: any[],
  vehicleLogs: any[],
  transactions: any[]
): { nodes: any[]; links: any[] } {
  const nodes: any[] = [];
  const links: any[] = [];
  const nodeIds = new Set<string>();
  const locationNames = new Set<string>();
  const personIdsByName = new Map<string, string>();

  const addNode = (node: any) => {
    if (!nodeIds.has(node.id)) {
      nodes.push(node);
      nodeIds.add(node.id);
    }
  };

  const addLocation = (value: string) => {
    const name = normalizeDawoodLocation(value);
    const coordinates = DAWOOD_LOCATION_COORDINATES[name];
    if (!coordinates || locationNames.has(name)) return;
    const id = `dawood_location_${slugify(name)}`;
    addNode({
      id,
      name,
      type: "location",
      role: "Dawood Network Intelligence Location",
      riskLevel: "high",
      attributes: {
        sourceDataset: "Dawood",
        associatedNetwork: "Dawood Network",
        details: "Location derived from Dawood telecom and vehicle intelligence records.",
      },
      confidenceScore: 0.9,
      latitude: coordinates[0],
      longitude: coordinates[1],
      locationCategory: "other",
    });
    locationNames.add(name);
  };

  const addPerson = (name: string, attributes: Record<string, any> = {}) => {
    const normalizedName = String(name || "Unknown Person").trim();
    const key = normalizedName.toLowerCase();
    if (!normalizedName || normalizedName === "Unknown Person") return null;
    const existingId = personIdsByName.get(key);
    if (existingId) return existingId;
    const id = `dawood_person_${slugify(normalizedName)}`;
    addNode({
      id,
      name: normalizedName,
      type: "person",
      role: attributes.role || "Dawood Dataset Associate",
      riskLevel: "high",
      attributes: { sourceDataset: "Dawood", ...attributes },
      confidenceScore: 0.88,
    });
    personIdsByName.set(key, id);
    return id;
  };

  const addRelationship = (id: string, source: string | null, target: string | null, relationshipType: string, evidenceSummary: string, weight = 5) => {
    if (!source || !target || source === target) return;
    links.push({ id, source, target, relationshipType, evidenceSummary, weight, confidence: 0.88 });
  };

  const networkId = "dawood_network";
  addNode({
    id: networkId,
    name: "Dawood Network",
    type: "organization",
    role: "Organized Crime Network",
    riskLevel: "critical",
    attributes: { sourceDataset: "Dawood" },
    confidenceScore: 0.94,
  });

  people.forEach((person) => {
    const personId = addPerson(person.Name, {
      alias: person.Alias,
      role: person.Role,
      location: person["Country/HQ"],
      contact: person.Phone || person.Synthetic_Phone_Number,
    });
    const hq = String(person["Country/HQ"] || "");
    const city = hq.split("/")[1];
    if (city) {
      const locationName = Object.keys(DAWOOD_LOCATION_COORDINATES).find((name) => name.includes(city));
      if (locationName) {
        addLocation(locationName);
        addRelationship(`dawood_hq_${personId}_${slugify(locationName)}`, personId, `dawood_location_${slugify(locationName)}`, "based_in", "Dawood People record lists this headquarters.", 6);
      }
    }
  });
  telecom.forEach((record, index) => {
    const callerId = addPerson(record.Caller_ID);
    const receiverId = addPerson(record.Receiver_ID);
    const locationName = normalizeDawoodLocation(String(record["Cell Tower Location"] || ""));
    addLocation(locationName);
    const locationId = `dawood_location_${slugify(locationName)}`;
    addRelationship(`dawood_call_${record.Call_ID || index}`, callerId, receiverId, "communicated_with", `Telecom CDR ${record.Call_ID || "record"}; ${record.Type || "communication"}.`, 4);
    addRelationship(`dawood_call_location_${record.Call_ID || index}`, callerId, locationId, "frequents_location", "Dawood telecom CDR cell-tower location.", 3);
  });
  vehicleLogs.forEach((record, index) => {
    const personId = addPerson(record.Person_ID);
    const vehicleId = `dawood_vehicle_${slugify(record.Vehicle_ID || `vehicle_${index}`)}`;
    const locationName = normalizeDawoodLocation(String(record.Location_ID || ""));
    addLocation(locationName);
    addNode({
      id: vehicleId,
      name: String(record.Vehicle_ID || `Vehicle ${index + 1}`),
      type: "vehicle",
      role: "Dawood Network Vehicle",
      riskLevel: "high",
      attributes: { sourceDataset: "Dawood", activity: record.Activity, timestamp: record.Timestamp },
      confidenceScore: 0.86,
    });
    addRelationship(`dawood_vehicle_person_${record.Log_ID || index}`, personId, vehicleId, "uses_vehicle", `Vehicle log ${record.Log_ID || "record"}.`, 4);
    addRelationship(`dawood_vehicle_location_${record.Log_ID || index}`, vehicleId, `dawood_location_${slugify(locationName)}`, "observed_at", "Dawood vehicle log location.", 4);
  });
  transactions.forEach((record, index) => {
    const senderId = addPerson(record.Sender_name);
    const receiverId = addPerson(record.Receiver_name);
    addRelationship(`dawood_transaction_${record.Transaction_ID || index}`, senderId, receiverId, "transferred_funds", `Transaction ${record.Transaction_ID || "record"}; ${record["Amount INR"] || "amount unavailable"}.`, 6);
  });

  nodes.filter((node) => node.type === "location").forEach((location) => {
    links.push({
      id: `dawood_network_${location.id}`,
      source: networkId,
      target: location.id,
      relationshipType: "operates_in",
      evidenceSummary: "Dawood dataset records network activity at this location.",
      weight: 8,
      confidence: 0.9,
    });
  });

  return { nodes, links };
}

export async function fetchLiveGraphData(): Promise<{ nodes: any[]; links: any[]; source: string } | null> {
  // 1. Prioritize live data pushed by partner's local device agent
  if (partnerLiveCache && partnerLiveCache.nodes.length > 0) {
    return {
      nodes: partnerLiveCache.nodes.map(normalizeLiveEntity),
      links: partnerLiveCache.links,
      source: "partner_device_live",
    };
  }

  // 2. Prefer MongoDB Atlas data, since this project uses Atlas as the source of truth.
  const db = await getMongoDb();
  if (db) {
    try {
      const rawNodes = await db.collection("entities").find({}).toArray();
      const rawLinks = await db.collection("relationships").find({}).toArray();

        const nodes = rawNodes.map(normalizeLiveEntity);

      const links = rawLinks.map((l) => ({
          id: l.id || String(l._id),
          source: l.source,
          target: l.target,
          relationshipType: l.relationshipType || "associated_with",
          evidenceSummary: l.evidenceSummary || "Database recorded link",
          amount: l.amount,
          frequency: l.frequency,
          weight: l.weight || 3,
      }));

      const bombCollection = "Bomb Data";
      try {
        const bombDocs = await db.collection(bombCollection).find({}).toArray();
        if (bombDocs.length > 0) {
          const bombGraph = buildBombDataGraph(bombDocs);
          nodes.push(...bombGraph.nodes);
          links.push(...bombGraph.links);
        }
      } catch {
        // Collection not found in this Atlas database; continue to Neo4j fallback.
      }

      const dawoodGraph = buildDawoodLocationGraph(
        await db.collection("Dawood-People").find({}).toArray(),
        await db.collection("Dawood-Telecom").find({}).toArray(),
        await db.collection("Dawood-VehicleLogs").find({}).toArray(),
        await db.collection("Dawood-Transaction").find({}).toArray()
      );
      nodes.push(...dawoodGraph.nodes);
      links.push(...dawoodGraph.links);

      if (nodes.length > 0) {
        return {
          nodes,
          links,
          source: "mongodb_atlas_live",
        };
      }
    } catch (err: any) {
      console.warn("Error querying MongoDB live graph:", err.message);
    }
  }

  // 3. Fall back to Neo4j if Atlas is empty or unavailable.
  const neoDriver = getNeo4jDriver();
  if (neoDriver) {
    try {
      const session = neoDriver.session();
      try {
        const result = await session.run(`
          MATCH (n)
          OPTIONAL MATCH (n)-[r]->(m)
          RETURN n, r, m
        `);

        if (result.records.length > 0) {
          const nodeMap = new Map<string, any>();
          const links: any[] = [];

          result.records.forEach((record) => {
            const n = record.get("n");
            const r = record.get("r");
            const m = record.get("m");

            if (n) {
              const normalized = normalizeNeo4jEntity(n);
              if (!nodeMap.has(normalized.id)) nodeMap.set(normalized.id, normalized);
            }

            if (m) {
              const normalized = normalizeNeo4jEntity(m);
              if (!nodeMap.has(normalized.id)) nodeMap.set(normalized.id, normalized);
            }

            if (r && n && m) {
              const sourceId = normalizeNeo4jEntity(n).id;
              const targetId = normalizeNeo4jEntity(m).id;
              const relationshipProperties = r.properties || {};
              const linkId = String(relationshipProperties.id || `rel_${r.identity}`);

              links.push({
                id: linkId,
                source: sourceId,
                target: targetId,
                relationshipType: String(r.type || relationshipProperties.relationshipType || "linked_to").toLowerCase(),
                evidenceSummary: relationshipProperties.evidenceSummary || `Neo4j relationship: ${r.type || "linked_to"}`,
                amount: relationshipProperties.amount,
                frequency: relationshipProperties.frequency ? Number(relationshipProperties.frequency) : undefined,
                weight: relationshipProperties.weight ? Number(relationshipProperties.weight) : 3,
                confidence: relationshipProperties.confidence ? Number(relationshipProperties.confidence) : 0.9,
              });
            }
          });

          const nodes = Array.from(nodeMap.values());
          const uniqueLinks = Array.from(new Map(links.map((link) => [link.id, link])).values());
          if (nodes.length > 0) {
            return {
              nodes,
              links: uniqueLinks,
              source: "neo4j_live",
            };
          }
        }
      } finally {
        await session.close();
      }
    } catch (err: any) {
      console.warn("Error querying Neo4j live graph:", err.message);
    }
  }

  return null;
}

/**
 * Synchronize / Push Ingested Data to MongoDB and Neo4j
 */
export async function syncGraphToDatabases(
  nodes: any[],
  links: any[],
  caseId: string = "NCRB-WD-2024-092"
): Promise<{ mongodbCount: number; neo4jCount: number; errors: string[] }> {
  const result = { mongodbCount: 0, neo4jCount: 0, errors: [] as string[] };

  // Sync to MongoDB
  const db = await getMongoDb();
  if (db) {
    try {
      for (const node of nodes) {
        await db.collection("entities").updateOne(
          { id: node.id },
          { $set: { ...node, caseId, updatedAt: new Date() } },
          { upsert: true }
        );
        result.mongodbCount++;
      }

      for (const link of links) {
        await db.collection("relationships").updateOne(
          { id: link.id },
          { $set: { ...link, caseId, updatedAt: new Date() } },
          { upsert: true }
        );
      }
    } catch (err: any) {
      result.errors.push(`MongoDB Sync Error: ${err.message}`);
    }
  }

  // Sync to Neo4j
  const driver = getNeo4jDriver();
  if (driver) {
    const session = driver.session();
    try {
      // Upsert nodes
      for (const node of nodes) {
        await session.run(
          `
          MERGE (n:Entity {id: $id})
          SET n.name = $name,
              n.type = $type,
              n.role = $role,
              n.riskLevel = $riskLevel,
              n.confidenceScore = $confidenceScore,
              n.caseId = $caseId,
              n.updatedAt = datetime()
        `,
          {
            id: node.id,
            name: node.name,
            type: node.type || "person",
            role: node.role || "Target",
            riskLevel: node.riskLevel || "medium",
            confidenceScore: node.confidenceScore || 0.9,
            caseId,
          }
        );
        result.neo4jCount++;
      }

      // Upsert links
      for (const link of links) {
        await session.run(
          `
          MATCH (a:Entity {id: $sourceId})
          MATCH (b:Entity {id: $targetId})
          MERGE (a)-[r:RELATION {id: $id}]->(b)
          SET r.relationshipType = $relType,
              r.evidenceSummary = $evidence,
              r.amount = $amount,
              r.weight = $weight,
              r.caseId = $caseId
        `,
          {
            id: link.id,
            sourceId: typeof link.source === "object" ? link.source.id : link.source,
            targetId: typeof link.target === "object" ? link.target.id : link.target,
            relType: link.relationshipType || "LINKED_TO",
            evidence: link.evidenceSummary || "",
            amount: link.amount || null,
            weight: Number(link.weight || 3),
            caseId,
          }
        );
      }
    } catch (err: any) {
      result.errors.push(`Neo4j Sync Error: ${err.message}`);
    } finally {
      await session.close();
    }
  }

  return result;
}

/** Copy the current Atlas graph into Neo4j without requiring a browser upload. */
export async function syncAtlasToNeo4j(
  caseId: string = "NCRB-WD-2024-092"
): Promise<{ entities: number; relationships: number; errors: string[] }> {
  const result = { entities: 0, relationships: 0, errors: [] as string[] };
  const db = await getMongoDb();
  const driver = getNeo4jDriver();

  if (!db) {
    result.errors.push("MongoDB Atlas is not connected.");
    return result;
  }
  if (!driver) {
    result.errors.push("Neo4j is not configured or connected.");
    return result;
  }

  try {
    const nodes = await db.collection("entities").find({}).toArray();
    const links = await db.collection("relationships").find({}).toArray();
    const bombDocs = await db.collection("Bomb Data").find({}).toArray();
    if (bombDocs.length > 0) {
      const bombGraph = buildBombDataGraph(bombDocs);
      nodes.push(...bombGraph.nodes);
      links.push(...bombGraph.links);
    }
    const dawoodGraph = buildDawoodLocationGraph(
      await db.collection("Dawood-People").find({}).toArray(),
      await db.collection("Dawood-Telecom").find({}).toArray(),
      await db.collection("Dawood-VehicleLogs").find({}).toArray(),
      await db.collection("Dawood-Transaction").find({}).toArray()
    );
    nodes.push(...dawoodGraph.nodes);
    links.push(...dawoodGraph.links);
    const session = driver.session();

    try {
      for (const node of nodes) {
        const attributes = node.attributes || {};
        await session.run(
          `MERGE (n:Entity {id: $id})
           SET n.name = $name,
               n.type = $type,
               n.role = $role,
               n.riskLevel = $riskLevel,
               n.confidenceScore = $confidenceScore,
               n.caseId = $caseId,
               n.latitude = $latitude,
               n.longitude = $longitude,
               n.locationCategory = $locationCategory,
               n.attributes = $attributes,
               n.updatedAt = datetime()`,
          {
            id: String(node.id || node._id),
            name: String(node.name || node.id || node._id),
            type: node.type || "person",
            role: node.role || "Target",
            riskLevel: node.riskLevel || "medium",
            confidenceScore: Number(node.confidenceScore ?? 0.9),
            caseId: node.caseId || caseId,
            latitude: Number.isFinite(node.latitude) ? Number(node.latitude) : null,
            longitude: Number.isFinite(node.longitude) ? Number(node.longitude) : null,
            locationCategory: node.locationCategory || null,
            attributes: JSON.stringify(attributes),
          }
        );
        result.entities++;
      }

      for (const link of links) {
        const source = typeof link.source === "object" ? link.source.id : link.source;
        const target = typeof link.target === "object" ? link.target.id : link.target;
        if (!source || !target) continue;

        await session.run(
          `MATCH (a:Entity {id: $source})
           MATCH (b:Entity {id: $target})
           MERGE (a)-[r:RELATION {id: $id}]->(b)
           SET r.relationshipType = $relationshipType,
               r.evidenceSummary = $evidenceSummary,
               r.weight = $weight,
               r.confidence = $confidence,
               r.amount = $amount,
               r.caseId = $caseId,
               r.updatedAt = datetime()`,
          {
            id: String(link.id || link._id),
            source: String(source),
            target: String(target),
            relationshipType: link.relationshipType || "associated_with",
            evidenceSummary: link.evidenceSummary || "Imported from MongoDB Atlas",
            weight: Number(link.weight || 3),
            confidence: Number(link.confidence || 0.9),
            amount: link.amount ? String(link.amount) : null,
            caseId: link.caseId || caseId,
          }
        );
        result.relationships++;
      }
    } finally {
      await session.close();
    }
  } catch (err: any) {
    result.errors.push(`Atlas to Neo4j sync error: ${err.message}`);
  }

  return result;
}
