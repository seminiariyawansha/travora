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
  if (!remoteUrl || typeof remoteUrl !== "string" || !remoteUrl.trim()) {
    return null;
  }
  // If it's already a local file path, reuse directly
  if (remoteUrl.startsWith("file://")) {
    return remoteUrl;
  }
  const localPath = FileSystem.documentDirectory + localFileName;
  const result = await FileSystem.downloadAsync(remoteUrl, localPath);
  return result.uri;
}

export async function downloadDestination(destinationId) {
  const destination = await getDestination(destinationId);
  const points = (await getPoints(destinationId)) || [];
  const db = await getDb();

  let savedCount = 0;
  const skipped = []; // ids of points that could not be saved

  for (const point of points) {
    try {
      const content =
        (await getPointContent(destinationId, point.id)) || point.content;
      if (!content) {
        skipped.push(point.id);
        continue;
      }

      const cleanPointId = String(point.id).replace(/[^a-zA-Z0-9_-]/g, "_");

      // Download each image safely
      const localImagePaths = [];
      const images = Array.isArray(content.images) ? content.images : [];
      for (let i = 0; i < images.length; i++) {
        const imageUrl = images[i];
        if (imageUrl && typeof imageUrl === "string" && imageUrl.trim()) {
          try {
            const localPath = await downloadFile(
              imageUrl,
              `${cleanPointId}_image_${i}.jpg`,
            );
            if (localPath) localImagePaths.push(localPath);
          } catch (imgErr) {
            console.log(
              `Failed to download image ${i} for point ${point.id}:`,
              imgErr?.message || imgErr,
            );
          }
        }
      }

      // Download the video, if there is one
      let localVideoPath = null;
      if (
        content.videoUrl &&
        typeof content.videoUrl === "string" &&
        content.videoUrl.trim()
      ) {
        try {
          localVideoPath = await downloadFile(
            content.videoUrl,
            `${cleanPointId}_video.mp4`,
          );
        } catch (vidErr) {
          console.log(
            `Failed to download video for point ${point.id}:`,
            vidErr?.message || vidErr,
          );
        }
      }

      // Save everything into the local database
      await db.runAsync(
        `INSERT OR REPLACE INTO cached_points
         (id, destinationId, name, latitude, longitude, radiusMeters, indoorFriendly, pointsValue, storyText, imageLocalPaths, videoLocalPath)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          point.id,
          destinationId,
          point.name ?? "",
          point.latitude != null ? Number(point.latitude) : 0,
          point.longitude != null ? Number(point.longitude) : 0,
          point.radiusMeters != null ? Number(point.radiusMeters) : 0,
          point.indoorFriendly ? 1 : 0,
          point.pointsValue != null ? Number(point.pointsValue) : 0,
          content.storyText ?? "",
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
