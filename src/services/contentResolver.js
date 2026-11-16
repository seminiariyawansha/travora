// src/services/contentResolver.js
import { getCachedPointById } from "../db/offlineContentService";
import { getPointContent } from "./destinationService";

// Don't let a slow connection freeze the screen
function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("timed out")), ms),
    ),
  ]);
}

// Downloaded (cached) media is used when it exists, so it works offline.
// Live content is added on top when reachable (this is where the quiz comes from).
export async function resolvePointContent(destinationId, pointId) {
  const cached = await getCachedPointById(pointId);

  let live = null;
  try {
    live = await withTimeout(getPointContent(destinationId, pointId), 5000);
  } catch (error) {
    console.log("Live content unavailable:", error.message);
  }

  if (cached) {
    return {
      ...(live || {}),
      storyText: cached.storyText ?? live?.storyText ?? "",
      images: cached.imageLocalPaths?.length
        ? cached.imageLocalPaths
        : (live?.images ?? []),
      videoUrl: cached.videoLocalPath || live?.videoUrl || "",
      isFromCache: true,
    };
  }

  return { ...(live || {}), isFromCache: false };
}
