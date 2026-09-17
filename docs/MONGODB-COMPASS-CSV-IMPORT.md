# MongoDB Compass CSV Import

The application reads graph data from the MongoDB database configured by `MONGODB_URI`.
It expects these collections:

- `entities`: graph nodes
- `relationships`: graph edges

## 1. Prepare the CSV files

Import nodes and relationships separately. A single flat CSV cannot describe graph edges reliably unless it is transformed first.

### `entities.csv`

Required columns:

```text
id,name,type,role,riskLevel,confidenceScore,latitude,longitude,locationCategory
```

Allowed values:

- `type`: `person`, `organization`, `location`, `phone`, `vehicle`, `financial_account`
- `riskLevel`: `critical`, `high`, `medium`, `low`
- `locationCategory`: `crime_scene`, `last_known_location`, `police_station`, `other`

Optional columns such as `alias`, `contact`, and `address` can be stored in an `attributes` JSON field after preprocessing. Compass imports CSV values as strings, so convert numeric fields such as `confidenceScore`, `latitude`, and `longitude` to numbers before importing or run a conversion step afterward.

Example:

```csv
id,name,type,role,riskLevel,confidenceScore,latitude,longitude,locationCategory
loc_paharganj_safehouse,Paharganj Transit Safehouse,location,Illegal Staging Facility,critical,0.98,28.6431,77.2144,crime_scene
```

### `relationships.csv`

Required columns:

```text
id,source,target,relationshipType,evidenceSummary,weight,confidence,amount,frequency
```

`source` and `target` must exactly match `entities.id` values.

Example:

```csv
id,source,target,relationshipType,evidenceSummary,weight,confidence,amount,frequency
rel_001,person_amit_paswan,loc_paharganj_safehouse,frequents_location,Surveillance record,7,0.92,,12
```

## 2. Connect Compass to Atlas

1. In Atlas, open **Connect** > **MongoDB Compass**.
2. Copy the Atlas connection string.
3. Replace the username and password placeholders. Do not commit this URI.
4. In Compass, paste the URI and connect.
5. Select or create database `kautilya_db`.
6. Create collections named exactly `entities` and `relationships`.
7. Open each collection, choose **Add Data** > **Import JSON or CSV file**, select the matching CSV, and import it.
8. Confirm that the imported fields are named exactly as the headers above.

## 3. Point the application at Atlas

Set the server environment variable in `.env`:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>/<database>?retryWrites=true&w=majority
MONGODB_DATABASE=<database>
```

Use the same database name selected in Compass. `MONGODB_DATABASE` takes precedence; otherwise the server uses the database path in `MONGODB_URI`, falling back to `kautilya_db`. Restart the app after changing `.env` because the server reads environment variables at startup.

## 4. Verify the connection

Open the app's **DB GATEWAY** status panel. It should report MongoDB as connected and show the imported entity count.

The graph endpoint reads up to 500 entities and 1,000 relationships per request. For larger imports, add indexes before using the data in the UI:

```javascript
db.entities.createIndex({ id: 1 }, { unique: true })
db.relationships.createIndex({ id: 1 }, { unique: true })
db.relationships.createIndex({ source: 1, target: 1 })
```

## Important

- Atlas itself supports CSV imports through Compass; Compass is only the client used to perform the import.
- Never put Atlas credentials in frontend code or upload them to the browser.
- Configure Atlas **Network Access** to allow the machine running this server.
- If the CSV contains untrusted values, validate and normalize it before import.
- The current server prefers Neo4j when Neo4j is connected, then MongoDB Atlas, then the sample dataset. Disable or disconnect Neo4j if MongoDB should be the active graph source.
