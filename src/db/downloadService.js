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

  for (const point of points) {
    const content = await getPointContent(destinationId, point.id);
    if (!content) continue;

    const localImagePaths = [];
    for (let i = 0; i < (content.images || []).length; i++) {
      const localPath = await downloadFile(
        content.images[i],
        `${point.id}_image_${i}.jpg`,
      );
      localImagePaths.push(localPath);
    }

    let localVideoPath = null;
    if (content.videoUrl) {
      localVideoPath = await downloadFile(
        content.videoUrl,
        `${point.id}_video.mp4`,
      );
    }

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
  }

  return { destination, pointCount: points.length };
}
