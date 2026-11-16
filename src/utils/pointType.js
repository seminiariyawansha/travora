// src/utils/pointType.js
// Works out whether a point is indoor, however the data was saved.

const TRUE_WORDS = ["true", "yes", "y", "1", "indoor", "indoors", "inside"];
const FALSE_WORDS = ["false", "no", "n", "0", "outdoor", "outdoors", "outside"];

// true / false when we can tell, null when the value means nothing
function toBoolean(value) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number")
    return value === 1 ? true : value === 0 ? false : null;
  if (typeof value === "string") {
    const text = value.trim().toLowerCase();
    if (TRUE_WORDS.includes(text)) return true;
    if (FALSE_WORDS.includes(text)) return false;
  }
  return null;
}

// Makes "indoorFriendly", "indoor_friendly" and "IsIndoor" all look the same
function cleanKey(key) {
  return key.toLowerCase().replace(/[^a-z]/g, "");
}

export function isIndoorPoint(point) {
  if (!point) return false;
  const entries = Object.entries(point);

  // 1. A field with "indoor" in its name (indoorFriendly, indoor, isIndoor...)
  for (const [key, value] of entries) {
    if (cleanKey(key).includes("indoor")) {
      const answer = toBoolean(value);
      if (answer !== null) return answer;
    }
  }

  // 2. A field with "outdoor" in its name: outdoor = true means NOT indoor
  for (const [key, value] of entries) {
    if (cleanKey(key).includes("outdoor")) {
      const answer = toBoolean(value);
      if (answer !== null) return !answer;
    }
  }

  // 3. A label field such as type, category, setting, environment or kind
  for (const [key, value] of entries) {
    if (
      /type|category|setting|environment|kind/.test(cleanKey(key)) &&
      typeof value === "string"
    ) {
      const text = value.toLowerCase();
      if (text.includes("outdoor") || text.includes("outside")) return false;
      if (text.includes("indoor") || text.includes("inside")) return true;
    }
  }

  return false;
}

// Returns the point with a clean true/false in indoorFriendly
export function normalizePoint(point) {
  return { ...point, indoorFriendly: isIndoorPoint(point) };
}
