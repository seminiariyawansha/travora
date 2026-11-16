// scripts/seedPoints.mjs  — uses Firebase Admin SDK (bypasses security rules)
// Usage:  node scripts/seedPoints.mjs
//
// Requires: SERVICE_ACCOUNT_KEY_PATH env var  OR  place key as scripts/serviceAccountKey.json
//
import { readFileSync, readdirSync } from "fs";
import { resolve } from "path";
import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// ─── Load service account (auto-detect any .json in scripts/) ────────────────
const scriptsDir = resolve("scripts");

// 1. Try explicit env var or fixed name
let keyPath = process.env.SERVICE_ACCOUNT_KEY_PATH;

// 2. Auto-detect: find any .json in scripts/ that looks like a service account
if (!keyPath) {
  const candidates = readdirSync(scriptsDir).filter(
    (f) =>
      f.endsWith(".json") &&
      f !== "package.json" &&
      !f.startsWith(".")
  );
  if (candidates.length === 0) {
    console.error("\n❌  No service account .json found in the scripts/ folder.");
    console.error("    Download it from Firebase Console → Project Settings → Service accounts");
    console.error("    → Generate new private key → drop the downloaded .json into the scripts/ folder\n");
    process.exit(1);
  }
  keyPath = resolve(scriptsDir, candidates[0]);
  console.log(`🔑  Using service account key: ${candidates[0]}`);
}

let serviceAccount;
try {
  serviceAccount = JSON.parse(readFileSync(keyPath, "utf8"));
} catch {
  console.error(`\n❌  Could not read service account key from: ${keyPath}\n`);
  process.exit(1);
}

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

// ─── Point data ──────────────────────────────────────────────────────────────
const DESTINATION_POINTS = {
  dambulla_cave: [
    {
      id: "golden_buddha",
      name: "Golden Buddha Statue",
      description: "A stunning 30-metre golden Buddha statue seated at the base of the rock – the largest Buddha statue in Sri Lanka.",
      latitude: 7.8567, longitude: 80.6486, type: "outdoor", pointsValue: 10, geofenceRadius: 60,
    },
    {
      id: "cave_entrance",
      name: "Cave Temple Entrance",
      description: "The grand entrance to the UNESCO World Heritage cave temple complex, carved into the base of a 160-metre rock.",
      latitude: 7.8572, longitude: 80.6490, type: "outdoor", pointsValue: 8, geofenceRadius: 50,
    },
    {
      id: "cave_1_devaraja",
      name: "Cave 1 – Devaraja Viharaya",
      description: "The smallest cave houses a 15-metre reclining Buddha statue carved from solid rock, with Ananda weeping at his feet.",
      latitude: 7.8575, longitude: 80.6492, type: "indoor", pointsValue: 12, geofenceRadius: 40,
    },
    {
      id: "cave_2_maharaja",
      name: "Cave 2 – Maharaja Viharaya",
      description: "The largest and most impressive cave contains 56 statues of the Buddha, two of Vishnu and one of Kataragama.",
      latitude: 7.8577, longitude: 80.6494, type: "indoor", pointsValue: 15, geofenceRadius: 40,
    },
    {
      id: "rock_summit_view",
      name: "Rock Summit Viewpoint",
      description: "Panoramic view of the surrounding jungle, paddy fields and the Sigiriya rock from 350 metres above sea level.",
      latitude: 7.8580, longitude: 80.6497, type: "outdoor", pointsValue: 10, geofenceRadius: 50,
    },
  ],

  mirissa_beach: [
    {
      id: "whale_watch_point",
      name: "Whale Watch Point",
      description: "The best spot on the southern coast to board whale-watching tours. Blue whales and sperm whales are regularly spotted from November to April.",
      latitude: 5.9484, longitude: 80.4549, type: "outdoor", pointsValue: 10, geofenceRadius: 80,
    },
    {
      id: "coconut_hill",
      name: "Coconut Tree Hill",
      description: "A small promontory lined with towering coconut palms jutting out into the Indian Ocean – one of the most photographed spots in Sri Lanka.",
      latitude: 5.9480, longitude: 80.4555, type: "outdoor", pointsValue: 8, geofenceRadius: 60,
    },
    {
      id: "parrot_rock",
      name: "Parrot Rock",
      description: "A large rock formation at the eastern end of Mirissa beach, perfect for watching the sunrise over the ocean.",
      latitude: 5.9476, longitude: 80.4570, type: "outdoor", pointsValue: 8, geofenceRadius: 60,
    },
    {
      id: "mirissa_harbor",
      name: "Mirissa Fishing Harbor",
      description: "Watch colourful fishing boats head out at dawn. Fresh tuna, swordfish and king prawn are unloaded here every morning.",
      latitude: 5.9471, longitude: 80.4535, type: "outdoor", pointsValue: 6, geofenceRadius: 70,
    },
    {
      id: "secret_beach",
      name: "Secret Beach",
      description: "A hidden cove accessible through a coconut grove, offering calm sheltered waters ideal for swimming.",
      latitude: 5.9490, longitude: 80.4540, type: "outdoor", pointsValue: 10, geofenceRadius: 50,
    },
  ],

  kandy_temple: [
    {
      id: "tooth_relic_shrine",
      name: "Temple of the Sacred Tooth Relic",
      description: "Houses a tooth relic of the Buddha, the most important Buddhist relic in the world. Puja ceremonies are held three times daily.",
      latitude: 7.2936, longitude: 80.6413, type: "indoor", pointsValue: 15, geofenceRadius: 50,
    },
    {
      id: "kandy_lake",
      name: "Kandy Lake Viewpoint",
      description: "An artificial lake built in 1807 by the last Kandyan king. The reflections of the Temple and surrounding hills are breathtaking at dawn.",
      latitude: 7.2929, longitude: 80.6421, type: "outdoor", pointsValue: 8, geofenceRadius: 70,
    },
    {
      id: "royal_palace",
      name: "Royal Palace Complex",
      description: "The adjacent royal palace and audience hall, featuring impressive wooden pillars and intricate Kandyan architecture.",
      latitude: 7.2940, longitude: 80.6410, type: "outdoor", pointsValue: 10, geofenceRadius: 60,
    },
    {
      id: "museum_national",
      name: "National Museum Kandy",
      description: "Showcases regalia and artefacts from the Kandyan Kingdom, including royal costumes, jewellery and ivory carvings.",
      latitude: 7.2932, longitude: 80.6408, type: "indoor", pointsValue: 8, geofenceRadius: 50,
    },
    {
      id: "bahiravakanda",
      name: "Bahiravakanda Buddha Statue",
      description: "A 27-metre white Buddha statue on a hilltop offering a panoramic 360° view over all of Kandy city.",
      latitude: 7.2965, longitude: 80.6397, type: "outdoor", pointsValue: 12, geofenceRadius: 60,
    },
  ],

  "galle-fort": [
    {
      id: "fort_gate",
      name: "Main Dutch Gate",
      description: "The original entrance to the fort, built by the Dutch in 1669. The VOC (Dutch East India Company) coat of arms is carved above the arch.",
      latitude: 6.0271, longitude: 80.2170, type: "outdoor", pointsValue: 10, geofenceRadius: 50,
    },
    {
      id: "lighthouse",
      name: "Galle Lighthouse",
      description: "The oldest lighthouse in Sri Lanka (1848), still in active use. The view from the ramparts at sunset is unforgettable.",
      latitude: 6.0252, longitude: 80.2168, type: "outdoor", pointsValue: 10, geofenceRadius: 60,
    },
    {
      id: "ramparts_walk",
      name: "Fort Ramparts Walk",
      description: "Walk the 1.3-km fortified walls overlooking the Indian Ocean on three sides – a UNESCO World Heritage Site.",
      latitude: 6.0261, longitude: 80.2175, type: "outdoor", pointsValue: 8, geofenceRadius: 80,
    },
    {
      id: "dutch_reformed_church",
      name: "Dutch Reformed Church",
      description: "One of the oldest Protestant churches in Sri Lanka (1755), with original Dutch tombstones covering the floor.",
      latitude: 6.0280, longitude: 80.2165, type: "indoor", pointsValue: 8, geofenceRadius: 50,
    },
    {
      id: "galle_fort_museum",
      name: "Historical Mansion Museum",
      description: "A colonial-era mansion converted into a museum displaying antiques, gems, lace, and wooden carvings from the Dutch period.",
      latitude: 6.0275, longitude: 80.2178, type: "indoor", pointsValue: 6, geofenceRadius: 40,
    },
  ],

  anuradhapura: [
    {
      id: "sri_maha_bodhi",
      name: "Sri Maha Bodhi",
      description: "The sacred fig tree grown from a cutting of the original Bodhi tree under which the Buddha attained enlightenment. Planted in 288 BC — the oldest recorded tree in the world.",
      latitude: 8.3480, longitude: 80.3972, type: "outdoor", pointsValue: 15, geofenceRadius: 60,
    },
    {
      id: "ruwanwelisaya",
      name: "Ruwanwelisaya Dagoba",
      description: "A magnificent white stupa 103 metres tall, built by King Dutugemunu in 140 BC. One of the tallest ancient structures in the world.",
      latitude: 8.3523, longitude: 80.3966, type: "outdoor", pointsValue: 15, geofenceRadius: 70,
    },
    {
      id: "jetavanaramaya",
      name: "Jetavanaramaya Stupa",
      description: "Once the tallest stupa in the world at 122 metres. Built in the 3rd century AD, it required 93 million baked bricks to construct.",
      latitude: 8.3555, longitude: 80.4001, type: "outdoor", pointsValue: 12, geofenceRadius: 70,
    },
    {
      id: "thuparamaya",
      name: "Thuparamaya Dagoba",
      description: "The first stupa built in Sri Lanka after the introduction of Buddhism (247 BC). It is said to enshrine the right collarbone of the Buddha.",
      latitude: 8.3540, longitude: 80.3978, type: "outdoor", pointsValue: 10, geofenceRadius: 60,
    },
    {
      id: "isurumuniya",
      name: "Isurumuniya Viharaya",
      description: "A beautiful rock temple with ancient bas-relief carvings including the famous 'Lovers' and 'Royal Family' sculptures.",
      latitude: 8.3425, longitude: 80.3918, type: "outdoor", pointsValue: 10, geofenceRadius: 60,
    },
  ],

  nine_arch_bridge: [
    {
      id: "bridge_main_view",
      name: "Nine Arch Bridge",
      description: "One of the best examples of colonial-era railway construction. Built in 1921 without steel — entirely from stone, brick and cement.",
      latitude: 6.8768, longitude: 81.0608, type: "outdoor", pointsValue: 15, geofenceRadius: 80,
    },
    {
      id: "train_viewpoint",
      name: "Train Viewpoint Clifftop",
      description: "The most photographed viewpoint above the bridge where you can watch the blue train pass through the nine arches against lush green hills.",
      latitude: 6.8773, longitude: 81.0614, type: "outdoor", pointsValue: 12, geofenceRadius: 60,
    },
    {
      id: "ella_rock_trail",
      name: "Ella Rock Trail Head",
      description: "The trailhead for the 4-hour hike up Ella Rock, which passes through tea plantations and offers stunning valley views.",
      latitude: 6.8780, longitude: 81.0598, type: "outdoor", pointsValue: 10, geofenceRadius: 70,
    },
    {
      id: "ella_gap_view",
      name: "Ella Gap Viewpoint",
      description: "A breathtaking natural gap in the mountains framing a view of the southern plains stretching all the way to the coast.",
      latitude: 6.8760, longitude: 81.0575, type: "outdoor", pointsValue: 10, geofenceRadius: 80,
    },
  ],
};

// ─── Seed ────────────────────────────────────────────────────────────────────
async function seed() {
  let total = 0;
  for (const [destinationId, points] of Object.entries(DESTINATION_POINTS)) {
    console.log(`\n📍 ${destinationId} (${points.length} points)`);
    for (const point of points) {
      const { id, ...data } = point;
      await db
        .collection("destinations")
        .doc(destinationId)
        .collection("points")
        .doc(id)
        .set(data, { merge: true });
      console.log(`   ✅ ${id}: ${data.name}`);
      total++;
    }
  }
  console.log(`\n🎉 Done! Seeded ${total} points across ${Object.keys(DESTINATION_POINTS).length} destinations.`);
  process.exit(0);
}

seed().catch((err) => {
  console.error("\n❌ Seed failed:", err.message);
  process.exit(1);
});
