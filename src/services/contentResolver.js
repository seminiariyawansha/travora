// src/services/contentResolver.js
import { getCachedPointById } from "../db/offlineContentService";
import { getPointContent } from "./destinationService";

// Tries the local cache first (downloaded content), falls back to live
// Firestore/Storage data otherwise. This is what makes new Admin content
// show up immediately, even before anyone has downloaded it.
export async function resolvePointContent(destinationId, pointId) {
  const cached = await getCachedPointById(pointId);
  if (cached) {
    return {
      storyText: cached.storyText,
      images: cached.imageLocalPaths,
      videoUrl: cached.videoLocalPath,
      isFromCache: true,
    };
  }

  const live = await getPointContent(destinationId, pointId);
  return { ...live, isFromCache: false };
}
