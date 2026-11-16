// src/components/MapSearch.js
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
    ActivityIndicator,
    Keyboard,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { colors } from "../theme/colors";

// Searches places in Sri Lanka with OpenStreetMap's Nominatim service.
// It runs only when the user submits, never while typing (their usage policy).
async function searchPlaces(query) {
  const url =
    "https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&countrycodes=lk&accept-language=en&q=" +
    encodeURIComponent(query);

  const response = await fetch(url, {
    headers: {
      "User-Agent": "Travora/1.0 (student project)",
      Accept: "application/json",
    },
  });
  if (!response.ok) throw new Error("Search failed");

  const data = await response.json();
  return data.map((item) => ({
    id: String(item.place_id),
    name: item.name || item.display_name.split(",")[0],
    subtitle: item.display_name,
    lat: parseFloat(item.lat),
    lng: parseFloat(item.lon),
  }));
}

function dotColor(status) {
  if (status === "visited") return "#8FA89F";
  if (status === "next") return "#C8553D";
  return colors.terracotta;
}

export default function MapSearch({
  points,
  onSelectPoint,
  onSelectPlace,
  onClear,
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [places, setPlaces] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  const trimmed = query.trim();
  const localMatches = trimmed
    ? points
        .filter((p) => p.name?.toLowerCase().includes(trimmed.toLowerCase()))
        .slice(0, 5)
    : [];

  function handleChange(text) {
    setQuery(text);
    setOpen(true);
    setSearched(false);
    setPlaces([]);
    setError("");
  }

  async function runOnlineSearch() {
    if (trimmed.length < 3 || searching) return;
    Keyboard.dismiss();
    setSearching(true);
    setError("");
    try {
      setPlaces(await searchPlaces(trimmed));
      setSearched(true);
    } catch (err) {
      console.log("Place search failed:", err.message);
      setError("Couldn't search. This needs an internet connection.");
    } finally {
      setSearching(false);
    }
  }

  function pickPoint(point) {
    Keyboard.dismiss();
    setQuery(point.name);
    setOpen(false);
    onSelectPoint?.(point);
  }

  function pickPlace(place) {
    Keyboard.dismiss();
    setQuery(place.name);
    setOpen(false);
    onSelectPlace?.(place);
  }

  function clearAll() {
    setQuery("");
    setPlaces([]);
    setSearched(false);
    setError("");
    setOpen(false);
    onClear?.();
  }

  const showResults = open && trimmed.length > 0;

  return (
    <View style={styles.wrap}>
      <View style={styles.bar}>
        <Ionicons name="search" size={18} color={colors.gray} />
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={handleChange}
          onFocus={() => setOpen(true)}
          onSubmitEditing={runOnlineSearch}
          placeholder="Search places"
          placeholderTextColor={colors.gray}
          returnKeyType="search"
          autoCapitalize="none"
        />
        {query.length > 0 && (
          <Pressable onPress={clearAll} hitSlop={8}>
            <Ionicons name="close-circle" size={19} color={colors.gray} />
          </Pressable>
        )}
      </View>

      {showResults && (
        <View style={styles.results}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            style={{ maxHeight: 280 }}
          >
            {localMatches.length > 0 && (
              <Text style={styles.header}>Travora points</Text>
            )}
            {localMatches.map((point) => (
              <Pressable
                key={point.id}
                style={styles.row}
                onPress={() => pickPoint(point)}
              >
                <View
                  style={[
                    styles.dot,
                    { backgroundColor: dotColor(point.status) },
                  ]}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>{point.name}</Text>
                  <Text style={styles.rowSub}>
                    {point.status === "visited" ? "Visited" : "To visit"}
                  </Text>
                </View>
              </Pressable>
            ))}

            {places.length > 0 && (
              <Text style={styles.header}>Other places</Text>
            )}
            {places.map((place) => (
              <Pressable
                key={place.id}
                style={styles.row}
                onPress={() => pickPlace(place)}
              >
                <View style={[styles.dot, { backgroundColor: "#2B6CB0" }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>{place.name}</Text>
                  <Text style={styles.rowSub} numberOfLines={1}>
                    {place.subtitle}
                  </Text>
                </View>
              </Pressable>
            ))}

            {searching && (
              <ActivityIndicator color={colors.teal} style={{ padding: 14 }} />
            )}
            {error ? <Text style={styles.error}>{error}</Text> : null}

            {!searching &&
              searched &&
              places.length === 0 &&
              localMatches.length === 0 && (
                <Text style={styles.hint}>No places found.</Text>
              )}

            {!searching && !searched && trimmed.length >= 3 && (
              <Pressable style={styles.row} onPress={runOnlineSearch}>
                <Ionicons name="earth-outline" size={18} color={colors.teal} />
                <Text style={styles.moreText}>
                  Search the map for "{trimmed}"
                </Text>
              </Pressable>
            )}

            {!searching &&
              trimmed.length > 0 &&
              trimmed.length < 3 &&
              localMatches.length === 0 && (
                <Text style={styles.hint}>
                  Type at least 3 letters to search the map.
                </Text>
              )}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "absolute", top: 12, left: 12, right: 12, zIndex: 20 },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.white,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  input: { flex: 1, fontSize: 14, color: colors.ink, padding: 0 },
  results: {
    marginTop: 8,
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  header: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.gray,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  dot: { width: 12, height: 12, borderRadius: 6 },
  rowTitle: { fontSize: 13.5, fontWeight: "600", color: colors.ink },
  rowSub: { fontSize: 11.5, color: colors.gray, marginTop: 2 },
  moreText: { fontSize: 13, fontWeight: "600", color: colors.teal, flex: 1 },
  hint: { fontSize: 12.5, color: colors.gray, padding: 14 },
  error: { fontSize: 12.5, color: "#C0392B", fontWeight: "600", padding: 14 },
});
