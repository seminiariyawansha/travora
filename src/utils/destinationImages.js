// src/utils/destinationImages.js
// High-resolution photography of Sri Lanka heritage destinations and points

const DESTINATION_PHOTOS = {
  sigiriya:
    "https://images.unsplash.com/photo-1588598198321-9735fd52455b?q=80&w=1000&auto=format&fit=crop",
  "galle-fort":
    "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?q=80&w=1000&auto=format&fit=crop",
  ella:
    "https://images.unsplash.com/photo-1586861635167-e5223aadc9fe?q=80&w=1000&auto=format&fit=crop",
  kandy:
    "https://images.unsplash.com/photo-1546708973-b339540b5162?q=80&w=1000&auto=format&fit=crop",
  default:
    "https://images.unsplash.com/photo-1588598198321-9735fd52455b?q=80&w=1000&auto=format&fit=crop",
};

const POINT_PHOTOS = {
  lion_rock_viewpoint:
    "https://images.unsplash.com/photo-1588598198321-9735fd52455b?q=80&w=1000&auto=format&fit=crop",
  sigiriya_museum:
    "https://images.unsplash.com/photo-1566127444979-b3d2b654e3d7?q=80&w=1000&auto=format&fit=crop",
  water_gardens:
    "https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=1000&auto=format&fit=crop",
  frescoes:
    "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=1000&auto=format&fit=crop",
  default:
    "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1000&auto=format&fit=crop",
};

/**
 * Get real photo for a destination by id or name
 */
export function getDestinationPhoto(destinationId, destName) {
  const key = (destinationId || destName || "").toLowerCase().trim();
  if (key.includes("galle")) return DESTINATION_PHOTOS["galle-fort"];
  if (key.includes("sigiriya")) return DESTINATION_PHOTOS.sigiriya;
  if (key.includes("ella")) return DESTINATION_PHOTOS.ella;
  if (key.includes("kandy")) return DESTINATION_PHOTOS.kandy;
  return DESTINATION_PHOTOS[key] || DESTINATION_PHOTOS.default;
}

/**
 * Get real photo for a point of interest
 */
export function getPointPhoto(pointId, pointName, destinationId) {
  const pKey = (pointId || pointName || "").toLowerCase().trim();
  for (const [k, url] of Object.entries(POINT_PHOTOS)) {
    if (k !== "default" && pKey.includes(k)) return url;
  }
  if (pKey.includes("museum")) return POINT_PHOTOS.sigiriya_museum;
  if (pKey.includes("water") || pKey.includes("garden")) return POINT_PHOTOS.water_gardens;
  if (pKey.includes("fresco") || pKey.includes("painting") || pKey.includes("art"))
    return POINT_PHOTOS.frescoes;
  if (pKey.includes("rock") || pKey.includes("viewpoint") || pKey.includes("lion"))
    return POINT_PHOTOS.lion_rock_viewpoint;

  return getDestinationPhoto(destinationId);
}
