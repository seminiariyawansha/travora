import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { downloadDestination } from "../db/downloadService";
import { subscribeToConnectivity } from "../db/networkService";
import { getCachedPoints } from "../db/offlineContentService";
import { addPendingSync } from "../db/syncQueue";
import { syncPendingProgress } from "../db/syncService";
import { getDestinations } from "../services/destinationService";

export default function HomeScreen() {
  const [destinations, setDestinations] = useState<any[]>([]);
  const [testLog, setTestLog] = useState<string[]>([]);
  const [isOnline, setIsOnline] = useState<boolean | null>(null);

  useEffect(() => {
    const loadDestinations = async () => {
      try {
        const data = await getDestinations();
        console.log("✅ Firestore destinations:", data);
        setDestinations(data);
      } catch (error) {
        console.log("❌ Firestore error:", error);
      }
    };

    loadDestinations();
  }, []);

  // --- TEMPORARY: Step 15 connectivity watcher ---
  useEffect(() => {
    const unsubscribe = subscribeToConnectivity((online) => {
      setIsOnline(online);
      setTestLog((prev) => [
        ...prev,
        `Connectivity changed. Online? ${online}`,
      ]);
    });
    return unsubscribe;
  }, []);

  const log = (msg: string) => {
    console.log(msg);
    setTestLog((prev) => [...prev, msg]);
  };

  // --- TEMPORARY: Step 15 test handlers ---
  const handleTestDownload = async () => {
    if (destinations.length === 0) {
      log("❌ No destinations loaded yet — wait for Firestore to load first.");
      return;
    }
    const destinationId = destinations[0].id; // uses your first real destination
    try {
      const result = await downloadDestination(destinationId);
      log(`✅ Downloaded: ${JSON.stringify(result)}`);
    } catch (error) {
      log(`❌ Download error: ${error}`);
    }
  };

  const handleTestReadCache = async () => {
    if (destinations.length === 0) {
      log("❌ No destinations loaded yet.");
      return;
    }
    const destinationId = destinations[0].id;
    try {
      const points = await getCachedPoints(destinationId);
      log(`✅ Cached points: ${JSON.stringify(points)}`);
    } catch (error) {
      log(`❌ Read cache error: ${error}`);
    }
  };

  const handleTestOfflineUnlock = async () => {
    try {
      await addPendingSync({
        userId: "test-user-123",
        destinationId: destinations[0]?.id || "test-destination",
        pointId: "ancient_story_point",
        actionType: "unlock",
        pointsEarned: 20,
      });
      log("✅ Added pending sync item (simulated offline unlock)");
    } catch (error) {
      log(`❌ Add pending sync error: ${error}`);
    }
  };

  const handleTestSync = async () => {
    try {
      const count = await syncPendingProgress();
      log(`✅ Synced ${count} pending items`);
    } catch (error) {
      log(`❌ Sync error: ${error}`);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.logo}>TRAVORA</Text>
        <Text style={styles.greeting}>Discover places. Unlock stories.</Text>
      </View>

      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Explore the world 🌍</Text>

        <Text style={styles.heroText}>
          Visit amazing places and unlock their hidden stories when you reach
          the location.
        </Text>

        <Pressable style={styles.button}>
          <Text style={styles.buttonText}>Start Exploring</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>Featured Destinations</Text>

      {destinations.length > 0 ? (
        destinations.map((destination) => (
          <View style={styles.card} key={destination.id}>
            <Text style={styles.cardEmoji}>📍</Text>

            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{destination.name}</Text>

              <Text style={styles.cardText}>{destination.description}</Text>
            </View>
          </View>
        ))
      ) : (
        <View style={styles.loadingCard}>
          <Text style={styles.loadingText}>Loading destinations...</Text>
        </View>
      )}

      <Text style={styles.sectionTitle}>How Travora Works</Text>

      <View style={styles.steps}>
        <View style={styles.step}>
          <Text style={styles.stepIcon}>🗺️</Text>
          <Text style={styles.stepTitle}>Explore</Text>
          <Text style={styles.stepText}>Find interesting places.</Text>
        </View>

        <View style={styles.step}>
          <Text style={styles.stepIcon}>📍</Text>
          <Text style={styles.stepTitle}>Reach</Text>
          <Text style={styles.stepText}>Visit the location.</Text>
        </View>

        <View style={styles.step}>
          <Text style={styles.stepIcon}>🔓</Text>
          <Text style={styles.stepTitle}>Unlock</Text>
          <Text style={styles.stepText}>Discover its story.</Text>
        </View>
      </View>

      {/* ===== TEMPORARY TEST SECTION — remove before final PR ===== */}
      <Text style={styles.sectionTitle}>🧪 Offline Sync Test (Member 3)</Text>

      <Text style={{ marginBottom: 10, color: "#64748B" }}>
        Network status:{" "}
        {isOnline === null
          ? "checking..."
          : isOnline
            ? "Online ✅"
            : "Offline ❌"}
      </Text>

      <View style={{ gap: 10, marginBottom: 20 }}>
        <Pressable style={styles.testButton} onPress={handleTestDownload}>
          <Text style={styles.testButtonText}>
            1. Download first destination
          </Text>
        </Pressable>

        <Pressable style={styles.testButton} onPress={handleTestReadCache}>
          <Text style={styles.testButtonText}>2. Read cached points</Text>
        </Pressable>

        <Pressable style={styles.testButton} onPress={handleTestOfflineUnlock}>
          <Text style={styles.testButtonText}>3. Simulate offline unlock</Text>
        </Pressable>

        <Pressable style={styles.testButton} onPress={handleTestSync}>
          <Text style={styles.testButtonText}>4. Sync pending progress</Text>
        </Pressable>
      </View>

      <View style={styles.logBox}>
        {testLog.length === 0 ? (
          <Text style={styles.logText}>No test actions yet.</Text>
        ) : (
          testLog.map((entry, i) => (
            <Text key={i} style={styles.logText}>
              {entry}
            </Text>
          ))
        )}
      </View>
      {/* ===== END TEMPORARY TEST SECTION ===== */}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    padding: 20,
  },

  header: {
    marginTop: 25,
    marginBottom: 25,
  },

  logo: {
    fontSize: 28,
    fontWeight: "800",
    color: "#208AEF",
    letterSpacing: 2,
  },

  greeting: {
    marginTop: 6,
    fontSize: 15,
    color: "#64748B",
  },

  hero: {
    backgroundColor: "#208AEF",
    borderRadius: 24,
    padding: 24,
    marginBottom: 28,
  },

  heroTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 10,
  },

  heroText: {
    fontSize: 15,
    lineHeight: 23,
    color: "#EAF4FF",
  },

  button: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginTop: 20,
  },

  buttonText: {
    color: "#208AEF",
    fontWeight: "700",
  },

  sectionTitle: {
    fontSize: 21,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 15,
  },

  card: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },

  cardEmoji: {
    fontSize: 40,
    marginRight: 15,
  },

  cardContent: {
    flex: 1,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 5,
  },

  cardText: {
    fontSize: 13,
    lineHeight: 19,
    color: "#64748B",
  },

  loadingCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 20,
    marginBottom: 28,
  },

  loadingText: {
    color: "#64748B",
    textAlign: "center",
  },

  steps: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 40,
  },

  step: {
    width: "31%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 12,
    alignItems: "center",
  },

  stepIcon: {
    fontSize: 25,
    marginBottom: 7,
  },

  stepTitle: {
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 4,
  },

  stepText: {
    fontSize: 11,
    color: "#64748B",
    textAlign: "center",
  },

  testButton: {
    backgroundColor: "#0F172A",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },

  testButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 13,
  },

  logBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    marginBottom: 40,
  },

  logText: {
    fontSize: 11,
    color: "#334155",
    marginBottom: 4,
  },
});
