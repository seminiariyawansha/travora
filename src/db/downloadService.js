// db/downloadService.js
// Note: this project uses Expo SDK 57, where the classic download API lives in "expo-file-system/legacy"
import * as FileSystem from "expo-file-system/legacy";
import {
  getDestination,
  getPointContent,
  getPoints,
} from "../services/destinationService";
import { getDb } from "./database";

function isDirectVideoUrl(url) {
  if (!url || typeof url !== "string" || !url.trim()) return false;
  const lower = url.trim().toLowerCase();
  if (lower.includes("youtube.com") || lower.includes("youtu.be")) return false;
  return (
    lower.startsWith("http://") ||
    lower.startsWith("https://") ||
    lower.startsWith("file://")
  );
}

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
  // Treat HTTP errors (403 forbidden, 404 not found, etc.) as failures
  if (result.status && result.status >= 400) {
    console.log(`downloadFile: HTTP ${result.status} for ${localFileName}`);
    return null;
  }
  return result.uri;
}

export async function downloadDestination(destinationId) {
  const destination = await getDestination(destinationId);
  const points = (await getPoints(destinationId)) || [];
  const db = await getDb();

  // Save destination into cached_destinations
  if (destination) {
    let localHeroImage = destination.imageUrl || null;
    if (
      destination.imageUrl &&
      typeof destination.imageUrl === "string" &&
      destination.imageUrl.startsWith("http")
    ) {
      try {
        const cleanDestId = String(destinationId).replace(/[^a-zA-Z0-9_-]/g, "_");
        const downloadedHero = await downloadFile(
          destination.imageUrl,
          `${cleanDestId}_hero.jpg`,
        );
        if (downloadedHero) localHeroImage = downloadedHero;
      } catch (heroErr) {
        console.log(
          "Failed to download hero image for destination:",
          destinationId,
          heroErr?.message,
        );
      }
    }

    await db.runAsync(
      `INSERT OR REPLACE INTO cached_destinations
       (id, name, description, location, latitude, longitude, imageUrl)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        destinationId,
        destination.name ?? "",
        destination.description ?? "",
        destination.location ?? "",
        destination.latitude != null ? Number(destination.latitude) : null,
        destination.longitude != null ? Number(destination.longitude) : null,
        localHeroImage,
      ],
    );
  }

  let savedCount = 0;
  const skipped = []; // objects { id, reason } — only SQLite-save failures
  const noContent = []; // point IDs saved with empty content

  for (const point of points) {
    try {
      // Try the content sub-collection first, fall back to inline content map,
      // then fall back to top-level story/images/video fields
      let content =
        (await getPointContent(destinationId, point.id)) || point.content;

      // Support alternative top-level shape: story / images / video
      if (!content && (point.story || point.images || point.video)) {
        content = {
          storyText: point.story ?? "",
          images: point.images ?? [],
          videoUrl: point.video ?? null,
        };
      }

      let storyText = "";
      let images = [];
      let videoUrl = null;
      let hasContent = false;

      if (content) {
        storyText = content.storyText ?? "";
        images = Array.isArray(content.images) ? content.images : [];
        videoUrl = content.videoUrl ?? null;
        hasContent = true;
      } else {
        // No content at all — still save the point so geofence unlock works
        console.log(`Point ${point.id}: no content — saving with empty fields`);
        noContent.push(point.id);
      }

      const cleanPointId = String(point.id).replace(/[^a-zA-Z0-9_-]/g, "_");
      let hadBadImage = false;
      let hadBadVideo = false;

      // Download each image safely
      const localImagePaths = [];
      for (let i = 0; i < images.length; i++) {
        const imageUrl = images[i];
        if (imageUrl && typeof imageUrl === "string" && imageUrl.trim()) {
          try {
            const localPath = await downloadFile(
              imageUrl,
              `${cleanPointId}_image_${i}.jpg`,
            );
            if (localPath) localImagePaths.push(localPath);
            else hadBadImage = true;
          } catch (imgErr) {
            hadBadImage = true;
            console.log(
              `Failed to download image ${i} for point ${point.id}:`,
              imgErr?.message || imgErr,
            );
          }
        }
      }

      // Download the video if it is a direct URL (skip YouTube / empty links cleanly)
      let localVideoPath = null;
      if (isDirectVideoUrl(videoUrl)) {
        try {
          localVideoPath = await downloadFile(
            videoUrl,
            `${cleanPointId}_video.mp4`,
          );
        } catch (vidErr) {
          hadBadVideo = true;
          console.log(
            `Failed to download video for point ${point.id}:`,
            vidErr?.message || vidErr,
          );
        }
      }

      if (hasContent && (hadBadImage || hadBadVideo)) {
        const issues = [];
        if (hadBadImage) issues.push("bad image link");
        if (hadBadVideo) issues.push("bad video link");
        console.log(`Partial point saved ${point.id}: ${issues.join(", ")}`);
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
          storyText,
          JSON.stringify(localImagePaths),
          localVideoPath,
        ],
      );
      savedCount++;
    } catch (error) {
      console.log("Could not save point", point.id, error);
      skipped.push({ id: point.id, reason: error?.message || "database error" });
    }
  }

  return {
    destination,
    pointCount: points.length, // points found in Firebase
    savedCount, // points saved on the phone (includes no-content ones)
    skipped, // only SQLite-save failures: [{ id, reason }]
    noContent, // point IDs saved but with no story/images/video
  };
}
