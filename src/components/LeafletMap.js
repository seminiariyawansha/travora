// src/components/LeafletMap.js
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { WebView } from "react-native-webview";
import { colors } from "../theme/colors";

// Keep your team's GitHub repo address here (used as the tile Referer)
const APP_URL = "https://github.com/seminiariyawansha/travora.git";

// Diagnostic switch: if the map stays blank, set this to false and reload.
// (It only controls whether the page tells OpenStreetMap who it is.)
const SEND_REFERER = true;

// How long to wait for the map before showing the error message
const LOAD_TIMEOUT_MS = 12000;

// If OpenStreetMap ever shows an "Access blocked" picture, change this to "esri"
const TILE_PROVIDERS = {
  osm: {
    url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: "&copy; OpenStreetMap contributors",
  },
  esri: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri",
  },
};
const ACTIVE_TILES = "osm";

// The page is built once. Pins, the user's dot, the search pin and
// camera moves are all sent in afterwards through injected scripts.
function buildHtml(center, zoom) {
  const tiles = TILE_PROVIDERS[ACTIVE_TILES];

  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<style>
  html, body, #map { height: 100%; margin: 0; padding: 0; background: #EDE6D8; }
  .pin { width: 26px; height: 26px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg);
         border: 3px solid #fff; box-shadow: 0 3px 8px rgba(0,0,0,.35); }
  .pin span { display: block; transform: rotate(45deg); color: #fff; font: 700 12px/20px sans-serif; text-align: center; }
  .pin.todo { background: #E07A5F; }
  .pin.next { background: #C8553D; animation: pulse 1.6s infinite; }
  .pin.visited { background: #8FA89F; }
  .pin.search { background: #2B6CB0; }
  @keyframes pulse {
    0% { box-shadow: 0 0 0 0 rgba(200,85,61,.65); }
    100% { box-shadow: 0 0 0 16px rgba(200,85,61,0); }
  }
  .me { width: 16px; height: 16px; border-radius: 50%; background: #1E7A6F;
        border: 3px solid #fff; box-shadow: 0 0 0 6px rgba(30,122,111,.25); }
</style>
<script>
  // Send messages and errors back to the app so it can show what went wrong
  function post(obj) {
    if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify(obj));
  }
  window.onerror = function (message, source, line) {
    post({ type: 'error', message: String(message) + ' (line ' + line + ')' });
  };
</script>
</head>
<body>
<div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
        onerror="post({ type: 'error', message: 'The map library could not be downloaded. Check the internet connection.' })"></script>
<script>
  var map = L.map('map', { zoomControl: false }).setView([${center.lat}, ${center.lng}], ${zoom});
  L.tileLayer('${tiles.url}', {
    maxZoom: 19,
    referrerPolicy: 'strict-origin-when-cross-origin',
    attribution: '${tiles.attribution}'
  }).addTo(map);

  // Safe text for tooltips (names are never treated as HTML)
  function txt(s) { var el = document.createElement('span'); el.textContent = s; return el; }

  var markersLayer = L.layerGroup().addTo(map);
  var hasFitted = false;

  function renderPoints(points) {
    markersLayer.clearLayers();
    var bounds = [];
    points.forEach(function (p) {
      var cls = p.status === 'visited' ? 'visited' : (p.status === 'next' ? 'next' : 'todo');
      var inner = p.status === 'visited' ? '<span>&#10003;</span>' : '';
      var icon = L.divIcon({
        className: '',
        html: '<div class="pin ' + cls + '">' + inner + '</div>',
        iconSize: [26, 26],
        iconAnchor: [13, 26]
      });
      var marker = L.marker([p.lat, p.lng], { icon: icon, zIndexOffset: p.status === 'next' ? 1000 : 0 }).addTo(markersLayer);
      marker.bindTooltip(txt(p.name));
      marker.on('click', function () { post({ type: 'point', id: p.id }); });
      bounds.push([p.lat, p.lng]);
    });
    if (!hasFitted && bounds.length > 1) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 17 });
      hasFitted = true;
    }
  }

  var meMarker = null;
  function setUser(lat, lng, follow) {
    var icon = L.divIcon({ className: '', html: '<div class="me"></div>', iconSize: [16, 16], iconAnchor: [8, 8] });
    if (meMarker) { meMarker.setLatLng([lat, lng]); }
    else { meMarker = L.marker([lat, lng], { icon: icon, interactive: false }).addTo(map); }
    if (follow) { map.panTo([lat, lng]); }
  }

  function focusOn(lat, lng, zoom) {
    map.flyTo([lat, lng], zoom || 17, { duration: 0.8 });
  }

  var searchMarker = null;
  function clearSearchMarker() {
    if (searchMarker) { map.removeLayer(searchMarker); searchMarker = null; }
  }
  function setSearchMarker(lat, lng, label) {
    clearSearchMarker();
    var icon = L.divIcon({ className: '', html: '<div class="pin search"></div>', iconSize: [26, 26], iconAnchor: [13, 26] });
    searchMarker = L.marker([lat, lng], { icon: icon }).addTo(map);
    searchMarker.bindTooltip(txt(label), { permanent: true, direction: 'top', offset: [0, -24] });
  }

  // Tell the app when the user drags the map, so it stops following the GPS dot
  map.on('dragstart', function () { post({ type: 'moved' }); });

  window.mapReady = true;
  post({ type: 'ready' });
</script>
</body>
</html>`;
}

export default function LeafletMap({
  center,
  zoom = 15,
  points,
  userLocation,
  followUser = false,
  focus,
  searchMarker,
  onPointPress,
  onUserMoved,
  height,
}) {
  const webRef = useRef(null);
  const readyRef = useRef(false);
  const latest = useRef({});
  latest.current = { points, userLocation, followUser, focus, searchMarker };

  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [detail, setDetail] = useState("");
  const [attempt, setAttempt] = useState(0);

  // The page is rebuilt only if the centre or zoom changes
  const html = useMemo(
    () => buildHtml(center, zoom),
    [center.lat, center.lng, zoom],
  );

  // Start (or restart) the loading timer
  useEffect(() => {
    readyRef.current = false;
    setStatus("loading");
    setDetail("");

    const timer = setTimeout(() => {
      if (!readyRef.current) {
        setStatus("error");
        setDetail(
          (d) =>
            d ||
            "The map took too long to load. Check your internet connection.",
        );
      }
    }, LOAD_TIMEOUT_MS);

    return () => clearTimeout(timer);
  }, [attempt]);

  function failWith(message) {
    console.log("Map error:", message);
    if (!readyRef.current) {
      setStatus("error");
      setDetail(message);
    }
  }

  // Run a script in the map page, but only once the page is ready
  function run(code) {
    webRef.current?.injectJavaScript(`if (window.mapReady) { ${code} } true;`);
  }

  function sendPoints() {
    run(`renderPoints(${JSON.stringify(latest.current.points)});`);
  }

  function sendUser() {
    const { userLocation: loc, followUser: follow } = latest.current;
    if (!loc) return;
    run(
      `setUser(${loc.latitude}, ${loc.longitude}, ${follow ? "true" : "false"});`,
    );
  }

  function sendSearchMarker() {
    const s = latest.current.searchMarker;
    if (s) {
      run(
        `setSearchMarker(${s.lat}, ${s.lng}, ${JSON.stringify(s.label || "")});`,
      );
    } else {
      run("clearSearchMarker();");
    }
  }

  function sendFocus() {
    const f = latest.current.focus;
    if (f) run(`focusOn(${f.lat}, ${f.lng}, ${f.zoom || 17});`);
  }

  const pointsKey = JSON.stringify(points);
  const searchKey = searchMarker
    ? `${searchMarker.lat},${searchMarker.lng}`
    : "none";

  useEffect(() => {
    sendPoints();
  }, [pointsKey]);

  useEffect(() => {
    sendUser();
  }, [userLocation?.latitude, userLocation?.longitude]);

  useEffect(() => {
    sendSearchMarker();
  }, [searchKey]);

  useEffect(() => {
    sendFocus();
  }, [focus?.key]);

  function handleMessage(event) {
    try {
      const message = JSON.parse(event.nativeEvent.data);

      if (message.type === "ready") {
        readyRef.current = true;
        setStatus("ready");
        // The page is up: send everything the map needs to show
        sendPoints();
        sendUser();
        sendSearchMarker();
        sendFocus();
      } else if (message.type === "error") {
        failWith(message.message);
      } else if (message.type === "point") {
        onPointPress?.(message.id);
      } else if (message.type === "moved") {
        onUserMoved?.();
      }
    } catch (e) {}
  }

  return (
    <View
      style={[styles.wrap, height != null ? { height } : { flex: 1 }]}
      // When the panel is hidden or shown the map is resized, so tell Leaflet
      onLayout={() => run("map.invalidateSize();")}
    >
      <WebView
        key={attempt}
        ref={webRef}
        originWhitelist={["*"]}
        source={SEND_REFERER ? { html, baseUrl: APP_URL } : { html }}
        applicationNameForUserAgent="Travora/1.0"
        javaScriptEnabled
        domStorageEnabled
        onMessage={handleMessage}
        onError={(e) =>
          failWith(e.nativeEvent.description || "The map page failed to load.")
        }
        onHttpError={(e) =>
          failWith(`The map page returned error ${e.nativeEvent.statusCode}.`)
        }
        style={styles.web}
      />

      {status !== "ready" && (
        <View style={styles.overlay}>
          {status === "loading" ? (
            <>
              <ActivityIndicator color={colors.teal} />
              <Text style={styles.overlayText}>Loading map...</Text>
            </>
          ) : (
            <>
              <Text style={styles.overlayTitle}>The map couldn't load</Text>
              <Text style={styles.overlayText}>{detail}</Text>
              <Pressable
                style={styles.retry}
                onPress={() => setAttempt((a) => a + 1)}
              >
                <Text style={styles.retryText}>Try again</Text>
              </Pressable>
            </>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: "100%", backgroundColor: "#EDE6D8", overflow: "hidden" },
  web: { flex: 1, backgroundColor: "transparent" },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#EDE6D8",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 32,
  },
  overlayTitle: { fontSize: 15, fontWeight: "700", color: colors.ink },
  overlayText: {
    fontSize: 12.5,
    color: colors.gray,
    textAlign: "center",
    lineHeight: 18,
  },
  retry: {
    marginTop: 6,
    backgroundColor: colors.teal,
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 999,
  },
  retryText: { color: colors.white, fontSize: 13, fontWeight: "600" },
});
