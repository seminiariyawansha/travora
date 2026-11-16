// src/data/mockData.js

export const mockDestinations = [
  {
    id: "sigiriya",
    name: "Sigiriya",
    description: "Ancient rock fortress in central Sri Lanka",
    latitude: 7.957,
    longitude: 80.7603,
    sizeMb: 42,
  },
  {
    id: "galle-fort",
    name: "Galle Fort",
    description: "Historic Dutch-era coastal fort",
    latitude: 6.0269,
    longitude: 80.2167,
    sizeMb: 37,
  },
];

export const mockPoints = {
  sigiriya: [
    {
      id: "lion_rock_viewpoint",
      name: "Lion Rock Viewpoint",
      latitude: 7.9572,
      longitude: 80.7605,
      radiusMeters: 100,
      indoorFriendly: false,
      pointsValue: 10,
      unlocked: true,
      content: {
        storyText:
          "Did you know? The lion's paw carvings once formed a giant gateway shaped like a lion's head.",
        images: ["placeholder1", "placeholder2"],
        videoUrl: "placeholder-video",
      },
    },
    {
      id: "sigiriya_museum",
      name: "Sigiriya Museum",
      latitude: 7.9568,
      longitude: 80.7598,
      radiusMeters: 80,
      indoorFriendly: true,
      pointsValue: 15,
      unlocked: true,
      content: {
        storyText:
          "The museum houses original frescoes and artifacts recovered from the rock.",
        images: ["placeholder1"],
        videoUrl: "placeholder-video",
      },
    },
    {
      id: "water_gardens",
      name: "Water Gardens",
      latitude: 7.955,
      longitude: 80.758,
      radiusMeters: 90,
      indoorFriendly: false,
      pointsValue: 15,
      unlocked: false,
      suggested: true,
      content: {
        storyText:
          "These 1,500-year-old gardens are among the oldest landscaped gardens in the world.",
        images: ["placeholder1"],
        videoUrl: "placeholder-video",
      },
    },
    {
      id: "frescoes",
      name: "Frescoes",
      latitude: 7.9575,
      longitude: 80.761,
      radiusMeters: 60,
      indoorFriendly: true,
      pointsValue: 0,
      unlocked: false,
      content: {
        storyText: "Vivid wall paintings believed to depict celestial maidens.",
        images: ["placeholder1"],
        videoUrl: "placeholder-video",
      },
    },
  ],
};

export const mockWeather = {
  condition: "Rain",
  isRaining: true,
  temperature: 26,
  reasonText: "Rain expected — indoor points suggested",
};

export const mockUser = {
  name: "Semini",
  totalPoints: 120,
  destinationsVisited: 1,
  pointsUnlocked: 2,
  badges: [
    { id: "sigiriya_explorer", name: "Sigiriya Explorer", earned: true },
  ],
};
