// db/database.js
import * as SQLite from "expo-sqlite";

let dbInstance = null;

export async function getDb() {
  if (dbInstance) return dbInstance;
  dbInstance = await SQLite.openDatabaseAsync("travora.db");
  await dbInstance.execAsync(`
    CREATE TABLE IF NOT EXISTS cached_points (
      id TEXT PRIMARY KEY,
      destinationId TEXT,
      name TEXT,
      latitude REAL,
      longitude REAL,
      radiusMeters INTEGER,
      indoorFriendly INTEGER,
      pointsValue INTEGER,
      storyText TEXT,
      imageLocalPaths TEXT,
      videoLocalPath TEXT
    );

    CREATE TABLE IF NOT EXISTS pending_sync (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId TEXT,
      destinationId TEXT,
      pointId TEXT,
      actionType TEXT,
      pointsEarned INTEGER,
      createdAt TEXT,
      synced INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS cached_weather (
      destinationId TEXT PRIMARY KEY,
      condition TEXT,
      isRaining INTEGER,
      temperature REAL,
      fetchedAt TEXT
    );
  `);
  return dbInstance;
}
