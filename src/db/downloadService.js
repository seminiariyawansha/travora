// db/downloadService.js
// Note: this project uses Expo SDK 57, where the classic download API lives in "expo-file-system/legacy"
import * as FileSystem from "expo-file-system/legacy";
import {
  getDestination,
  getPointContent,
  getPoints,
} from "../services/destinationService";
import { getDb } from "./database";

async function downloadFile(remoteUrl, localFileName) {
  const localPath = FileSystem.documentDirectory + localFileName;
  const result = await FileSystem.downloadAsync(remoteUrl, localPath);
  return result.uri;
}

export async function downloadDestination(destinationId) {
  const destination = await getDestination(destinationId);
  const points = await getPoints(destinationId);
  const db = await getDb();

  let savedCount = 0;
  const skipped = []; // ids of points that could not be saved

  for (const point of points) {
    try {
      const content = await getPointContent(destinationId, point.id);
      if (!content) {
        skipped.push(point.id);
        continue;
      }

      // Download each image
      const localImagePaths = [];
      for (let i = 0; i < (content.images || []).length; i++) {
        const localPath = await downloadFile(
          content.images[i],
          `${point.id}_image_${i}.jpg`,
        );
        localImagePaths.push(localPath);
      }

      // Download the video, if there is one
      let localVideoPath = null;
      if (content.videoUrl) {
        localVideoPath = await downloadFile(
          content.videoUrl,
          `${point.id}_video.mp4`,
        );
      }

      // Save everything into the local database
      await db.runAsync(
        `INSERT OR REPLACE INTO cached_points
         (id, destinationId, name, latitude, longitude, radiusMeters, indoorFriendly, pointsValue, storyText, imageLocalPaths, videoLocalPath)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          point.id,
          destinationId,
          point.name,
          point.latitude,
          point.longitude,
          point.radiusMeters,
          point.indoorFriendly ? 1 : 0,
          point.pointsValue,
          content.storyText,
          JSON.stringify(localImagePaths),
          localVideoPath,
        ],
      );
      savedCount++;
    } catch (error) {
      console.log("Could not download point", point.id, error);
      skipped.push(point.id);
    }
  }

  return {
    destination,
    pointCount: points.length, // points found in Firebase
    savedCount, // points really saved on the phone
    skipped, // points that failed or had no content
  };
}
