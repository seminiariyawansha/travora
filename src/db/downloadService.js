// db/downloadService.js
import * as FileSystem from "expo-file-system/legacy";
import { getDestinations } from "../services/destinationService";
import { getDb } from "./database";

async function downloadFile(remoteUrl, localFileName) {
  const localPath = FileSystem.documentDirectory + localFileName;
  const result = await FileSystem.downloadAsync(remoteUrl, localPath);
  return result.uri;
}

export async function downloadDestination(destinationId) {
  const allDestinations = await getDestinations();
  const destination = allDestinations.find((d) => d.id === destinationId);
  if (!destination) {
    throw new Error(`Destination "${destinationId}" not found`);
  }

  const db = await getDb();

  // Download each image
  const localImagePaths = [];
  const images = destination.images || [];
  for (let i = 0; i < images.length; i++) {
    try {
      const localPath = await downloadFile(
        images[i],
        `${destinationId}_image_${i}.jpg`,
      );
      localImagePaths.push(localPath);
    } catch (e) {
      console.log("Image download failed:", images[i], e);
    }
  }

  // Note: video is a YouTube link, not a direct file — can't be downloaded
  // for offline playback this way, so we just keep the remote URL as a reference.
  const videoLocalPath = destination.video || null;

  await db.runAsync(
    `INSERT OR REPLACE INTO cached_points
     (id, destinationId, name, latitude, longitude, radiusMeters, indoorFriendly, pointsValue, storyText, imageLocalPaths, videoLocalPath)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      destination.id,
      destination.id,
      destination.name,
      destination.latitude,
      destination.longitude,
      100, // default geofence radius (not in current Firestore model)
      0, // default indoorFriendly
      20, // default points value
      destination.story,
      JSON.stringify(localImagePaths),
      videoLocalPath,
    ],
  );

  return { destination, pointCount: 1 };
}
