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

// Google Maps & Street tile providers
const TILE_PROVIDERS = {
  google: {
    url: "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
    attribution: "&copy; Google Maps",
    maxZoom: 20,
  },
  googleSatellite: {
    url: "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
    attribution: "&copy; Google Maps",
    maxZoom: 20,
  },
  osm: {
    url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: "&copy; OpenStreetMap contributors",
    maxZoom: 19,
  },
};

const DEFAULT_PROVIDER = "google";
const LOAD_TIMEOUT_MS = 14000;

function buildHtml(center, zoom, tileType = DEFAULT_PROVIDER) {
  const tileConfig = TILE_PROVIDERS[tileType] || TILE_PROVIDERS.google;

  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<style>
  html, body, #map { height: 100%; margin: 0; padding: 0; background: #EDE6D8; }
  .pin { width: 20px; height: 20px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg);
         border: 3px solid #fff; box-shadow: 0 3px 8px rgba(0,0,0,.35); cursor: pointer; }
  .pin span { display: block; transform: rotate(45deg); color: #fff; font: 700 13px/22px sans-serif; text-align: center; }
  .pin.todo { background: #FFE047; }
  .pin.next { background: #FFE047; animation: pulse 1.5s infinite; }
  .pin.visited { background: #10534a; }
  .pin.search { background: #2196F3; }
  @keyframes pulse {
    0% { box-shadow: 0 0 0 0 rgba(200,85,61,.75); }
    100% { box-shadow: 0 0 0 16px rgba(200,85,61,0); }
  }
  .me { width: 18px; height: 18px; border-radius: 50%; background: #2196F3;
        border: 3px solid #fff; box-shadow: 0 0 0 6px rgba(33,150,243,.35); }
  .leaflet-popup-content-wrapper { border-radius: 14px; padding: 4px; box-shadow: 0 4px 14px rgba(0,0,0,.2); }
  .leaflet-popup-content { margin: 10px 12px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
  .popup-title { font-size: 13.5px; font-weight: 700; color: #1B1B1B; margin-bottom: 2px; }
  .popup-status { font-size: 11px; font-weight: 600; color: #10534a; }
  .popup-btn { margin-top: 8px; width: 100%; background: #10534a; color: #fff; border: none; padding: 6px 12px;
               border-radius: 8px; font-size: 11.5px; font-weight: 700; cursor: pointer; }
</style>
<script>
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
        onerror="post({ type: 'error', message: 'The map library could not be downloaded. Check internet connection.' })"></script>
<script>
  var map = L.map('map', { zoomControl: false }).setView([${center.lat}, ${center.lng}], ${zoom});
  
  var currentTileLayer = L.tileLayer('${tileConfig.url}', {
    maxZoom: ${tileConfig.maxZoom || 19},
    attribution: '${tileConfig.attribution}'
  }).addTo(map);

  function setTileType(type) {
    if (currentTileLayer) map.removeLayer(currentTileLayer);
    var url = 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}';
    if (type === 'satellite') {
      url = 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}';
    } else if (type === 'osm') {
      url = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
    }
    currentTileLayer = L.tileLayer(url, { maxZoom: 20 }).addTo(map);
  }

  var markersLayer = L.layerGroup().addTo(map);
  var routeLayer = L.layerGroup().addTo(map);
  var hasFitted = false;
  // NEW: remembers how many points were drawn last time, so the map can
  // re-fit itself when more places arrive (e.g. all destinations loaded)
  var lastCount = -1;

  // CHANGED: new third argument showRoute (false = no dashed route line)
  function renderPoints(points, userLoc, showRoute) {
    markersLayer.clearLayers();
    routeLayer.clearLayers();
    var bounds = [];

    // 1. Draw connecting walking / scenic route between points
    var routeCoords = [];
    if (userLoc && typeof userLoc.latitude === 'number' && typeof userLoc.longitude === 'number') {
      routeCoords.push([userLoc.latitude, userLoc.longitude]);
      bounds.push([userLoc.latitude, userLoc.longitude]);
    }

    points.forEach(function (p) {
      if (typeof p.lat === 'number' && typeof p.lng === 'number') {
        routeCoords.push([p.lat, p.lng]);
        bounds.push([p.lat, p.lng]);

        var cls = p.status === 'visited' ? 'visited' : (p.status === 'next' ? 'next' : 'todo');
        var inner = p.status === 'visited' ? '<span>&#10003;</span>' : '';
        var icon = L.divIcon({
          className: '',
          html: '<div class="pin ' + cls + '">' + inner + '</div>',
          iconSize: [28, 28],
          iconAnchor: [14, 28]
        });

        var marker = L.marker([p.lat, p.lng], {
          icon: icon,
          zIndexOffset: p.status === 'next' ? 1000 : 0
        }).addTo(markersLayer);

        var popupHtml = '<div class="popup-title">' + (p.name || '') + '</div>' +
          '<div class="popup-status">' + (p.status === 'visited' ? '✓ Visited' : (p.status === 'next' ? '★ Next stop' : '📍 To visit')) + '</div>' +
          '<button class="popup-btn" onclick="post({ type: \\'point\\', id: \\'' + p.id + '\\' })">Open Story & Info</button>';

        marker.bindPopup(popupHtml);
        marker.on('click', function () {
          marker.openPopup();
          post({ type: 'point', id: p.id });
        });
      }
    });

    // Draw route path line showing the roads to visit
    // (CHANGED: skipped when showRoute is false, e.g. when ALL places are
    // shown, because a line across every destination makes no sense)
    if (showRoute && routeCoords.length > 1) {
      L.polyline(routeCoords, {
        color: '#10534a',
        weight: 4,
        opacity: 0.8,
        dashArray: '8, 8',
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(routeLayer);
    }

    // CHANGED: fit the view on the first draw AND whenever the number of
    // points changes (not on every update, so panning is never overridden)
    if (bounds.length > 1 && (!hasFitted || points.length !== lastCount)) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 17 });
      hasFitted = true;
    }
    lastCount = points.length;
  }

  var meMarker = null;
  function setUser(lat, lng, follow) {
    var icon = L.divIcon({ className: '', html: '<div class="me"></div>', iconSize: [18, 18], iconAnchor: [9, 9] });
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
    var icon = L.divIcon({ className: '', html: '<div class="pin search"></div>', iconSize: [28, 28], iconAnchor: [14, 28] });
    searchMarker = L.marker([lat, lng], { icon: icon }).addTo(map);
    var el = document.createElement('span'); el.textContent = label;
    searchMarker.bindTooltip(el, { permanent: true, direction: 'top', offset: [0, -24] });
  }

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
  mapType = "google",
  showRoute = true, // NEW: false hides the dashed route line
  onPointPress,
  onUserMoved,
  height,
}) {
  const webRef = useRef(null);
  const readyRef = useRef(false);
  const latest = useRef({});
  latest.current = {
    points,
    userLocation,
    followUser,
    focus,
    searchMarker,
    mapType,
    showRoute,
  };

  const [status, setStatus] = useState("loading");
  const [detail, setDetail] = useState("");
  const [attempt, setAttempt] = useState(0);

  const html = useMemo(
    () => buildHtml(center, zoom, mapType),
    [center.lat, center.lng, zoom, mapType],
  );

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

  function run(code) {
    webRef.current?.injectJavaScript(`if (window.mapReady) { ${code} } true;`);
  }

  // CHANGED: also tells the page whether to draw the route line
  function sendPoints() {
    const pts = latest.current.points || [];
    const loc = latest.current.userLocation || null;
    const route = latest.current.showRoute !== false;
    run(
      `renderPoints(${JSON.stringify(pts)}, ${JSON.stringify(loc)}, ${route});`,
    );
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

  function sendTileType() {
    const type = latest.current.mapType || "google";
    run(`setTileType('${type}');`);
  }

  const pointsKey = JSON.stringify(points);
  const searchKey = searchMarker
    ? `${searchMarker.lat},${searchMarker.lng}`
    : "none";

  // CHANGED: redraw also when showRoute changes
  useEffect(() => {
    sendPoints();
  }, [pointsKey, userLocation?.latitude, userLocation?.longitude, showRoute]);

  useEffect(() => {
    sendUser();
  }, [userLocation?.latitude, userLocation?.longitude]);

  useEffect(() => {
    sendSearchMarker();
  }, [searchKey]);

  useEffect(() => {
    sendFocus();
  }, [focus?.key]);

  useEffect(() => {
    sendTileType();
  }, [mapType]);

  function handleMessage(event) {
    try {
      const message = JSON.parse(event.nativeEvent.data);

      if (message.type === "ready") {
        readyRef.current = true;
        setStatus("ready");
        sendTileType();
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
      onLayout={() => run("map.invalidateSize();")}
    >
      <WebView
        key={attempt}
        ref={webRef}
        originWhitelist={["*"]}
        source={{ html }}
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
              <Text style={styles.overlayText}>
                Loading Google Map & roads...
              </Text>
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
