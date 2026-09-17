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
    properties?.category ||
    properties?.kind ||
    labels.find((label) => label.toLowerCase() !== "entity") ||
    "person"
  ).toLowerCase().replace(/[\s-]+/g, "_");

  if (raw.includes("phone") || raw.includes("mobile") || raw.includes("imei")) return "phone";
  if (raw.includes("vehicle") || raw.includes("car") || raw.includes("auto")) return "vehicle";
  if (raw.includes("camera") || raw.includes("location") || raw.includes("station") || raw.includes("place")) return "location";
  if (raw.includes("upi") || raw.includes("bank") || raw.includes("account") || raw.includes("wallet") || raw.includes("financial")) return "financial_account";
  if (raw.includes("org") || raw.includes("company") || raw.includes("agency")) return "organization";
  return "person";
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
export async function fetchLiveGraphData(): Promise<{ nodes: any[]; links: any[]; source: string } | null> {
  // 1. Prioritize live data pushed by partner's local device agent
  if (partnerLiveCache && partnerLiveCache.nodes.length > 0) {
    return {
      nodes: partnerLiveCache.nodes,
      links: partnerLiveCache.links,
      source: "partner_device_live",
    };
  }

  // 2. Try Neo4j directly over tunnel or cloud
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

  // 2. Try MongoDB Atlas next
  const db = await getMongoDb();
  if (db) {
    try {
      const rawNodes = await db.collection("entities").find({}).toArray();
      const rawLinks = await db.collection("relationships").find({}).toArray();

      if (rawNodes.length > 0) {
        const nodes = rawNodes.map((n) => ({
          id: n.id || String(n._id),
          name: n.name,
          type: n.type || "person",
          role: n.role || "Target",
          riskLevel: n.riskLevel || "medium",
          attributes: n.attributes || {},
          confidenceScore: n.confidenceScore || 0.9,
        }));

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
