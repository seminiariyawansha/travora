// src/data/onboardingSlides.js
//
// HOW TO ADD YOUR MEDIA
// 1. Put your files in the project's  assets/onboarding/  folder (create it).
// 2. For each slide, replace   media: null   with ONE of these:
//      media: { type: "image", source: require("../../assets/onboarding/discover.jpg") },
//      media: { type: "video", source: require("../../assets/onboarding/discover.mp4") },
// 3. Restart with   npx expo start -c
//
// Images: square, about 800x800 px (JPG or WebP).
// Videos: MP4, muted, 3-6 seconds, square-ish, under about 2 MB.

export const onboardingSlides = [
  {
    id: "discover",
    title: "Discover stories\nnobody tells you",
    subtitle:
      "Every landmark in Sri Lanka hides a story. Find the hidden points around you and see what's waiting.",
    icon: "location-outline",
    media: null,
    chips: [
      {
        icon: "lock-closed-outline",
        label: "Hidden story",
        side: "left",
        top: 0.68,
      },
      {
        icon: "navigate-outline",
        label: "300 m away",
        side: "right",
        top: 0.14,
      },
    ],
  },
  {
    id: "unlock",
    title: "Walk there.\nUnlock it.",
    subtitle:
      "Content stays hidden until you reach the spot. Step inside the circle and the story is yours for good.",
    icon: "walk-outline",
    media: null,
    chips: [
      {
        icon: "radio-button-on-outline",
        label: "Within 100 m",
        side: "left",
        top: 0.14,
      },
      {
        icon: "checkmark-circle-outline",
        label: "Unlocked +10 pts",
        side: "right",
        top: 0.7,
      },
    ],
  },
  {
    id: "smart",
    title: "Smart in the rain.\nReady offline.",
    subtitle:
      "Travora adapts to the weather and keeps working without signal, so the adventure never stops.",
    icon: "rainy-outline",
    media: null,
    chips: [
      { icon: "rainy-outline", label: "Indoor first", side: "left", top: 0.2 },
      {
        icon: "cloud-download-outline",
        label: "Offline ready",
        side: "right",
        top: 0.68,
      },
    ],
  },
];
