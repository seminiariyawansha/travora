// src/utils/pointContent.js
// Finds the images and the quiz of a point, however they were saved.

function asArray(value) {
  if (Array.isArray(value)) return value;
  if (value && typeof value === "object") return Object.values(value);
  return [];
}

function pickValue(obj, regex) {
  for (const [key, value] of Object.entries(obj)) {
    if (regex.test(key) && value != null && value !== "") return value;
  }
  return undefined;
}

// ---------- Images ----------

function imagesFrom(source) {
  if (!source || typeof source !== "object") return [];
  const found = [];

  for (const [key, value] of Object.entries(source)) {
    if (!/image|photo|picture|gallery/i.test(key)) continue;

    if (typeof value === "string" && value) {
      found.push(value);
    } else {
      asArray(value).forEach((item) => {
        if (typeof item === "string" && item) found.push(item);
        else if (item && typeof item === "object") {
          const url = item.url ?? item.uri ?? item.src;
          if (typeof url === "string" && url) found.push(url);
        }
      });
    }
  }
  return [...new Set(found)];
}

// Looks in the resolved content first, then the point's own content, then the point
export function getImageList(point, content) {
  for (const source of [content, point?.content, point]) {
    const list = imagesFrom(source);
    if (list.length > 0) return list;
  }
  return [];
}

// ---------- Quiz ----------

function buildQuestion(o) {
  if (!o || typeof o !== "object") return null;

  const question =
    o.question ??
    o.q ??
    o.prompt ??
    pickValue(o, /question/i) ??
    o.text ??
    o.title;
  const optionsRaw =
    o.options ?? o.choices ?? o.answers ?? pickValue(o, /option|choice/i);

  const options = asArray(optionsRaw)
    .map((x) =>
      typeof x === "string" ? x : (x?.text ?? x?.label ?? x?.value ?? ""),
    )
    .map((x) => String(x).trim())
    .filter(Boolean);

  if (typeof question !== "string" || !question.trim() || options.length < 2)
    return null;

  const correctRaw =
    o.correctIndex ??
    o.correctAnswer ??
    o.correctOption ??
    o.correct ??
    o.answer ??
    pickValue(o, /correct|right/i);

  let correctIndex = -1;
  if (typeof correctRaw === "number") {
    correctIndex = correctRaw < options.length ? correctRaw : correctRaw - 1;
  } else if (typeof correctRaw === "string") {
    const text = correctRaw.trim().toLowerCase();
    const byText = options.findIndex((opt) => opt.toLowerCase() === text);
    if (byText >= 0) correctIndex = byText;
    else if (/^[a-f]$/.test(text)) correctIndex = text.charCodeAt(0) - 97;
    else if (/^\d+$/.test(text)) {
      const n = parseInt(text, 10);
      correctIndex = n < options.length ? n : n - 1;
    }
  }
  if (correctIndex < 0 || correctIndex >= options.length) correctIndex = -1;

  const explanation = o.explanation ?? pickValue(o, /explanation|reason/i);

  return {
    question: question.trim(),
    options,
    correctIndex,
    explanation: typeof explanation === "string" ? explanation : "",
  };
}

function questionsFrom(source) {
  if (!source || typeof source !== "object") return [];

  // 1. A field called quiz / quizzes / questions holding one question or a list
  for (const [key, value] of Object.entries(source)) {
    if (!/quiz|question/i.test(key) || value == null || value === "") continue;

    if (Array.isArray(value)) {
      const list = value.map(buildQuestion).filter(Boolean);
      if (list.length) return list;
    } else if (typeof value === "object") {
      const single = buildQuestion(value);
      if (single) return [single];

      const nested = asArray(value.questions ?? value.items)
        .map(buildQuestion)
        .filter(Boolean);
      if (nested.length) return nested;

      const fromValues = Object.values(value)
        .map(buildQuestion)
        .filter(Boolean);
      if (fromValues.length) return fromValues;
    }
  }

  // 2. Flat fields on the object itself, e.g. quiz_question, quiz_options, quiz_correct_index
  const flat = buildQuestion(source);
  return flat ? [flat] : [];
}

// Looks in the resolved content first, then the point's own content, then the point
export function extractQuiz(point, content) {
  for (const source of [content, point?.content, point]) {
    const list = questionsFrom(source);
    if (list.length > 0) return list;
  }
  return [];
}
