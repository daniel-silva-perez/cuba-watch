// [CLASSIFIED] CUBA WATCH — INTELLIGENCE TERMINAL
// CLEARANCE LEVEL 5 REQUIRED

console.log('%c[OSINT] CUBA WATCH INTELLIGENCE SYSTEM', 'color: #00ff41; font-size: 16px; font-weight: bold;');
console.log('%c> Initializing secure connection...', 'color: #008f11;');
console.log('%c> Authentication: PUBLIC SOURCES READY', 'color: #00ff41;');
console.log('%c> Source Policy: PUBLIC ONLY', 'color: #ff3333; font-weight: bold;');

// Generate random session ID
const sessionId = 'OSINT-' + Math.floor(10000 + Math.random() * 90000) + '-CUBA';
document.getElementById('session-id').textContent = sessionId;

// Classification clock
function updateClock() {
  const now = new Date();
  const iso = now.toISOString().replace('T', ' ').slice(0, 19);
  const el = document.getElementById('classification-clock');
  if (el) el.textContent = iso + ' UTC';
}
setInterval(updateClock, 1000);
updateClock();


// Collapsible UI state
const PANEL_STATE_PREFIX = "cuba-watch:panel-collapsed:";
const UI_STATE_KEYS = {
  globeActive: "cuba-watch:globe-active",
};

function getStoredBool(key, fallback = false) {
  try {
    const value = localStorage.getItem(key);
    return value == null ? fallback : value === "true";
  } catch {
    return fallback;
  }
}

function setStoredBool(key, value) {
  try { localStorage.setItem(key, String(Boolean(value))); } catch {}
}

function slugifyPanelKey(value, fallback) {
  const slug = String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || fallback;
}

function getPanelKey(panel) {
  if (!panel) return "unknown";
  if (!panel.dataset.panelKey) {
    const title = panel.querySelector(":scope > .section-header .section-title, :scope > .layer-control-header .layer-control-title")?.textContent;
    panel.dataset.panelKey = slugifyPanelKey(title || panel.id, panel.id || "panel");
  }
  return panel.dataset.panelKey;
}

function getPanelByRef(panelOrId) {
  if (typeof panelOrId === "string") return document.getElementById(panelOrId);
  return panelOrId;
}

function getDirectPanelHeader(panel) {
  return panel?.querySelector(":scope > .section-header, :scope > .layer-control-header");
}

function getDirectPanelBody(panel) {
  return panel?.querySelector(":scope > .collapsible-body, :scope > .layer-control-body");
}

function ensurePanelBody(panel, header) {
  if (!panel || !header || getDirectPanelBody(panel)) return;
  const body = document.createElement("div");
  body.className = "collapsible-body";
  const nodes = [];
  let cursor = header.nextSibling;
  while (cursor) {
    nodes.push(cursor);
    cursor = cursor.nextSibling;
  }
  nodes.forEach(node => body.appendChild(node));
  panel.appendChild(body);
}

function ensureCollapseButton(panel, header) {
  if (!panel || !header) return;
  if (header.querySelector(":scope > .collapse-btn, :scope > .section-actions > .collapse-btn")) return;
  let actions = header.querySelector(":scope > .section-actions");
  if (!actions) {
    actions = document.createElement("div");
    actions.className = "section-actions";
    const directMark = header.querySelector(":scope > .classification-mark");
    if (directMark) actions.appendChild(directMark);
    header.appendChild(actions);
  }
  const title = header.querySelector(".section-title, .layer-control-title")?.textContent?.trim() || "panel";
  const button = document.createElement("button");
  button.className = "collapse-btn";
  button.type = "button";
  button.textContent = "−";
  button.setAttribute("aria-label", `Collapse ${title}`);
  button.title = `Collapse ${title}`;
  button.addEventListener("click", () => togglePanel(panel));
  actions.appendChild(button);
}

function initializeCollapsiblePanels() {
  document.querySelectorAll(".sidebar > .sidebar-section").forEach((panel, index) => {
    panel.classList.add("collapsible-panel");
    if (!panel.id) panel.id = `sidebar-panel-${index + 1}`;
    getPanelKey(panel);
    const header = getDirectPanelHeader(panel);
    if (!header) return;
    header.classList.add("collapsible-header");
    ensurePanelBody(panel, header);
    ensureCollapseButton(panel, header);
  });
}

function setPanelCollapsed(panel, collapsed) {
  if (!panel) return;
  panel.classList.toggle("collapsed", collapsed);
  const button = panel.querySelector(":scope > .section-header .collapse-btn, :scope > .layer-control-header .collapse-btn");
  if (button) {
    button.textContent = collapsed ? "+" : "−";
    button.setAttribute("aria-expanded", String(!collapsed));
    const label = panel.querySelector(":scope > .section-header .section-title, :scope > .layer-control-header .layer-control-title")?.textContent?.trim() || "panel";
    button.setAttribute("aria-label", `${collapsed ? "Expand" : "Collapse"} ${label}`);
    button.title = `${collapsed ? "Expand" : "Collapse"} ${label}`;
  }
}

function togglePanel(panelOrId, force) {
  const panel = getPanelByRef(panelOrId);
  if (!panel) return;
  const collapsed = typeof force === "boolean" ? force : !panel.classList.contains("collapsed");
  setPanelCollapsed(panel, collapsed);
  setStoredBool(PANEL_STATE_PREFIX + getPanelKey(panel), collapsed);
}
window.togglePanel = togglePanel;

function toggleLayerControl(force) {
  togglePanel("layer-control", force);
}
window.toggleLayerControl = toggleLayerControl;

function toggleBriefingPanel(force) {
  togglePanel("briefing-panel", force);
}
window.toggleBriefingPanel = toggleBriefingPanel;

function restoreCollapsibleState() {
  initializeCollapsiblePanels();
  document.querySelectorAll(".collapsible-panel").forEach(panel => {
    const legacyLayer = panel.id === "layer-control" ? getStoredBool("cuba-watch:layer-control-collapsed", false) : false;
    const legacyBrief = panel.id === "briefing-panel" ? getStoredBool("cuba-watch:briefing-collapsed", false) : false;
    const collapsed = getStoredBool(PANEL_STATE_PREFIX + getPanelKey(panel), legacyLayer || legacyBrief);
    setPanelCollapsed(panel, collapsed);
  });
}


// Map cursor coordinates
function updateCoords(e) {
  const el = document.getElementById('cursor-coords');
  if (el && e.latlng) {
    const lat = e.latlng.lat.toFixed(4);
    const lon = e.latlng.lng.toFixed(4);
    const ns = lat >= 0 ? 'N' : 'S';
    const ew = lon >= 0 ? 'E' : 'W';
    el.textContent = `${Math.abs(lat)}°${ns} ${Math.abs(lon)}°${ew}`;
  }
}

const map = L.map("map", {
  center: [21.8, -79.5],
  zoom: 6,
  zoomControl: false,
  attributionControl: false,
});

function zoomMap(delta) {
  if (delta > 0) map.zoomIn();
  else map.zoomOut();
}
window.zoomMap = zoomMap;

map.on('mousemove', updateCoords);

// Basemap catalog — default providers are free/no-key tile sources.
// Satellite is visual context, not live collection; near-real-time context is handled by optional NASA overlays.
const basemaps = {
  nightvision: {
    label: "NIGHT VIS",
    provider: "OpenStreetMap + local CSS night filter",
    freshness: "map tiles / not live imagery",
    layer: L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
      attribution: "© OpenStreetMap",
    }),
  },
  dark: {
    label: "DARK",
    provider: "CARTO Dark Matter",
    freshness: "map tiles / not live imagery",
    layer: L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      maxZoom: 19,
      subdomains: "abcd",
      attribution: "© OpenStreetMap, © CARTO",
    }),
  },
  satellite: {
    label: "SAT",
    provider: "Esri World Imagery",
    freshness: "high-quality basemap / not live satellite",
    layer: L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
      maxZoom: 19,
      attribution: "Tiles © Esri, Maxar, Earthstar Geographics, and the GIS User Community",
    }),
  },
  street: {
    label: "STREET",
    provider: "OpenStreetMap",
    freshness: "community map tiles",
    layer: L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "© OpenStreetMap",
    }),
  },
  terrain: {
    label: "TERRAIN",
    provider: "OpenTopoMap",
    freshness: "topographic basemap",
    layer: L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", {
      maxZoom: 17,
      attribution: "© OpenTopoMap (CC-BY-SA)",
    }),
  },
};

const STORAGE_KEY = "cuba-watch:basemap";
const GIBS_DATE_KEY = "cuba-watch:gibs-date";
const IMAGERY_OPACITY_KEY = "cuba-watch:imagery-opacity";
let currentBasemap = null;

function isoDateOffset(days = 1) {
  const d = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 10);
}

function initialGibsDate() {
  try { return localStorage.getItem(GIBS_DATE_KEY) || isoDateOffset(1); }
  catch { return isoDateOffset(1); }
}

let gibsDate = initialGibsDate();
let imageryOpacity = (() => {
  try { return Number(localStorage.getItem(IMAGERY_OPACITY_KEY) || 0.62); }
  catch { return 0.62; }
})();

function gibsUrl(layerName, matrixSet, ext, dateMode = "dated") {
  const time = dateMode === "default" ? "default" : gibsDate;
  return `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/${layerName}/default/${time}/${matrixSet}/{z}/{y}/{x}.${ext}`;
}

function makeGibsLayer(cfg) {
  return L.tileLayer(gibsUrl(cfg.layerName, cfg.matrixSet, cfg.ext, cfg.dateMode), {
    maxZoom: cfg.maxZoom,
    opacity: cfg.opacity ?? imageryOpacity,
    attribution: cfg.attribution || "NASA GIBS / EOSDIS",
    bounds: [[-85, -180], [85, 180]],
    noWrap: true,
  });
}

const imageryOverlayCatalog = {
  gibsTrueColor: {
    label: "VIIRS TRUE COLOR",
    short: "Near-real-time visual satellite context from NASA GIBS. Usually delayed by hours/day.",
    layerName: "VIIRS_SNPP_CorrectedReflectance_TrueColor",
    matrixSet: "GoogleMapsCompatible_Level9",
    ext: "jpg",
    maxZoom: 9,
  },
  gibsTerra: {
    label: "TERRA TRUE COLOR",
    short: "MODIS Terra corrected reflectance. Good broad cloud/smoke/land-water context.",
    layerName: "MODIS_Terra_CorrectedReflectance_TrueColor",
    matrixSet: "GoogleMapsCompatible_Level9",
    ext: "jpg",
    maxZoom: 9,
  },
  gibsFires: {
    label: "THERMAL ANOMALIES",
    short: "VIIRS fire/thermal anomaly points. Useful for wildfires, industrial heat, and burn signatures.",
    layerName: "VIIRS_SNPP_Thermal_Anomalies_375m_All",
    matrixSet: "GoogleMapsCompatible_Level8",
    ext: "png",
    maxZoom: 8,
    opacity: 0.85,
  },
  gibsPrecip: {
    label: "PRECIP RATE",
    short: "IMERG precipitation-rate raster. Best used during storms and tropical weather monitoring.",
    layerName: "IMERG_Precipitation_Rate",
    matrixSet: "GoogleMapsCompatible_Level6",
    ext: "png",
    maxZoom: 6,
    opacity: 0.58,
  },
  gibsBlueMarble: {
    label: "BLUE MARBLE",
    short: "NASA Blue Marble shaded relief/bathymetry context layer. Static reference overlay.",
    layerName: "BlueMarble_ShadedRelief_Bathymetry",
    matrixSet: "GoogleMapsCompatible_Level8",
    ext: "jpg",
    maxZoom: 8,
    opacity: 0.45,
    dateMode: "default",
  },
};

const imageryOverlayLayers = {};
const activeImageryOverlays = new Set();

function buildImageryLayer(key) {
  const cfg = imageryOverlayCatalog[key];
  if (!cfg) return null;
  imageryOverlayLayers[key] = makeGibsLayer(cfg);
  return imageryOverlayLayers[key];
}

function toggleImageryOverlay(key, visible) {
  const cfg = imageryOverlayCatalog[key];
  if (!cfg) return;
  const layer = imageryOverlayLayers[key] || buildImageryLayer(key);
  if (!layer) return;
  if (visible) {
    layer.addTo(map);
    activeImageryOverlays.add(key);
    layer.setOpacity(cfg.opacity ?? imageryOpacity);
  } else {
    map.removeLayer(layer);
    activeImageryOverlays.delete(key);
  }
  updateImageryStatus();
}
window.toggleImageryOverlay = toggleImageryOverlay;

function setImageryOpacity(value) {
  imageryOpacity = Number(value);
  try { localStorage.setItem(IMAGERY_OPACITY_KEY, String(imageryOpacity)); } catch {}
  Object.entries(imageryOverlayLayers).forEach(([key, layer]) => {
    const cfg = imageryOverlayCatalog[key];
    if (activeImageryOverlays.has(key)) layer.setOpacity(cfg.opacity ?? imageryOpacity);
  });
  const label = document.getElementById("imagery-opacity-label");
  if (label) label.textContent = `${Math.round(imageryOpacity * 100)}%`;
}
window.setImageryOpacity = setImageryOpacity;

function setGibsDate(dateValue) {
  if (!dateValue) return;
  gibsDate = dateValue;
  try { localStorage.setItem(GIBS_DATE_KEY, gibsDate); } catch {}
  const active = Array.from(activeImageryOverlays);
  active.forEach(key => map.removeLayer(imageryOverlayLayers[key]));
  Object.keys(imageryOverlayLayers).forEach(key => delete imageryOverlayLayers[key]);
  active.forEach(key => toggleImageryOverlay(key, true));
  updateImageryStatus();
}
window.setGibsDate = setGibsDate;

function updateImageryStatus() {
  const el = document.getElementById("imagery-status");
  if (!el) return;
  const active = Array.from(activeImageryOverlays).map(k => imageryOverlayCatalog[k].label);
  const selectedBasemap = (() => { try { return localStorage.getItem(STORAGE_KEY) || "nightvision"; } catch { return "nightvision"; } })();
  el.innerHTML = active.length
    ? `<b>NASA overlays:</b> ${active.map(escapeHtml).join(", ")}<br><b>Date:</b> ${escapeHtml(gibsDate)} · <b>Provider:</b> NASA GIBS / EOSDIS`
    : `<b>Basemap:</b> ${escapeHtml(basemaps[selectedBasemap]?.provider || "selected basemap")}<br><b>Note:</b> Esri/CARTO/OSM basemaps are visual context, not live satellite collection.`;
}


// Experimental 3D globe view. Leaflet remains the operational 2D map for overlays/markers.
let cesiumViewer = null;

function initGlobe() {
  if (cesiumViewer || !document.getElementById("globe")) return cesiumViewer;
  if (!window.Cesium) {
    console.warn("[WARN] Cesium failed to load; globe mode unavailable.");
    const note = document.getElementById("globe-mode-note");
    if (note) note.textContent = "Cesium failed to load. Check your internet connection or CDN access.";
    return null;
  }

  try {
    cesiumViewer = new Cesium.Viewer("globe", {
      animation: false,
      timeline: false,
      baseLayerPicker: false,
      geocoder: false,
      homeButton: false,
      sceneModePicker: false,
      navigationHelpButton: false,
      fullscreenButton: false,
      infoBox: false,
      selectionIndicator: false,
      shadows: false,
      shouldAnimate: false,
      imageryProvider: new Cesium.UrlTemplateImageryProvider({
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        maximumLevel: 19,
        credit: "Esri World Imagery",
      }),
    });

    cesiumViewer.scene.globe.enableLighting = true;
    cesiumViewer.scene.skyAtmosphere.show = true;
    cesiumViewer.scene.fog.enabled = true;

    const points = [
      { name: "Havana", lon: -82.3666, lat: 23.1136, color: Cesium.Color.CYAN },
      { name: "Havana Port", lon: -82.3375, lat: 23.1469, color: Cesium.Color.ORANGE },
      { name: "Matanzas Energy Zone", lon: -81.5775, lat: 23.0411, color: Cesium.Color.YELLOW },
      { name: "Santiago de Cuba", lon: -75.8219, lat: 20.0169, color: Cesium.Color.LIME },
    ];

    points.forEach(p => {
      cesiumViewer.entities.add({
        name: p.name,
        position: Cesium.Cartesian3.fromDegrees(p.lon, p.lat, 12000),
        point: { pixelSize: 9, color: p.color, outlineColor: Cesium.Color.BLACK, outlineWidth: 2 },
        label: {
          text: p.name,
          font: "12px JetBrains Mono, monospace",
          fillColor: p.color,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          pixelOffset: new Cesium.Cartesian2(0, -18),
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 2500000),
        },
      });
    });

    // Approximate ALBA-1 cable context line from Venezuela to southeastern Cuba.
    cesiumViewer.entities.add({
      name: "ALBA-1 undersea cable context",
      polyline: {
        positions: Cesium.Cartesian3.fromDegreesArray([
          -67.03, 10.60,
          -70.50, 13.20,
          -74.15, 17.20,
          -75.70, 19.95,
        ]),
        width: 2,
        material: Cesium.Color.CYAN.withAlpha(0.65),
        clampToGround: false,
      },
    });

    cesiumViewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(-79.5, 21.8, 2200000),
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-55),
        roll: 0,
      },
      duration: 0,
    });
  } catch (err) {
    console.error("[ERROR] Cesium globe initialization failed:", err);
    return null;
  }
  return cesiumViewer;
}

function setGlobeActive(active, persist = true) {
  document.body.classList.toggle("globe-active", active);
  document.querySelectorAll(".mode-btn").forEach(b => {
    b.classList.toggle("active", active ? b.dataset.mode === "globe" : b.dataset.mode === (() => {
      try { return localStorage.getItem(STORAGE_KEY) || "nightvision"; } catch { return "nightvision"; }
    })());
  });
  if (active) {
    const viewer = initGlobe();
    if (viewer) setTimeout(() => viewer.resize(), 60);
  } else {
    setTimeout(() => map.invalidateSize(), 60);
  }
  if (persist) setStoredBool(UI_STATE_KEYS.globeActive, active);
}

function toggleGlobeMode(force) {
  const active = typeof force === "boolean" ? force : !document.body.classList.contains("globe-active");
  setGlobeActive(active);
}
window.toggleGlobeMode = toggleGlobeMode;

function setBasemap(key) {
  if (!basemaps[key]) return;
  setGlobeActive(false);
  if (currentBasemap) map.removeLayer(currentBasemap);
  currentBasemap = basemaps[key].layer.addTo(map);
  currentBasemap.bringToBack?.();
  document.body.className = document.body.className.replace(/\bmap-mode-\S+/g, "").trim();
  document.body.classList.add("map-mode-" + key);
  document.querySelectorAll(".mode-btn").forEach(b => {
    b.classList.toggle("active", b.dataset.mode === key);
  });
  try { localStorage.setItem(STORAGE_KEY, key); } catch {}
  updateImageryStatus();
}
window.setBasemap = setBasemap;

const initialMode = (() => {
  try { return localStorage.getItem(STORAGE_KEY) || "nightvision"; }
  catch { return "nightvision"; }
})();
const shouldRestoreGlobe = getStoredBool(UI_STATE_KEYS.globeActive, false);
setBasemap(initialMode);
restoreCollapsibleState();
if (shouldRestoreGlobe) toggleGlobeMode(true);
setTimeout(() => {
  const dateInput = document.getElementById("gibs-date");
  if (dateInput) dateInput.value = gibsDate;
  const op = document.getElementById("imagery-opacity");
  if (op) op.value = String(imageryOpacity);
  setImageryOpacity(imageryOpacity);
  updateImageryStatus();
}, 0);

// Tactical theater bounds - expanded to include PR and US bases
const theaterBounds = L.latLngBounds([[17.0, -88.0], [28.0, -68.0]]);
map.fitBounds(theaterBounds);

const flightLayer = L.layerGroup().addTo(map);
const shipLayer = L.layerGroup().addTo(map);
const basesLayer = L.layerGroup().addTo(map);
const movementsLayer = L.layerGroup().addTo(map);
const assetsLayer = L.layerGroup().addTo(map);
const seismicLayer = L.layerGroup().addTo(map);
const cableLayer = L.layerGroup().addTo(map);
const advisoryLayer = L.layerGroup().addTo(map);

const layerGroups = {
  flights: flightLayer,
  ships: shipLayer,
  bases: basesLayer,
  movements: movementsLayer,
  assets: assetsLayer,
  seismic: seismicLayer,
  cables: cableLayer,
  advisories: advisoryLayer,
};

function toggleLayer(key, visible) {
  const g = layerGroups[key];
  if (!g) return;
  if (visible) map.addLayer(g); else map.removeLayer(g);
}
window.toggleLayer = toggleLayer;

function glyphIcon(html, size = 18) {
  return L.divIcon({
    className: "glyph-icon",
    html: `<div class="glyph">${html}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

const TERMINAL_ICON_COLORS = {
  green: '#00ff41',
  cyan: '#00d9ff',
  amber: '#ffb000',
  red: '#ff5c5c',
  purple: '#b56cff',
  yellow: '#ffe66b',
  orange: '#ff8b3d',
  steel: '#9fb6c2',
};

function iconTile(accent, inner) {
  return `<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect x="1.5" y="1.5" width="17" height="17" rx="3" fill="#07110c" stroke="${accent}" stroke-width="1.25"/>
    <path d="M4 5.25h12" stroke="${accent}" stroke-width="1" opacity="0.35"/>
    <g>${inner}</g>
  </svg>`;
}

function buildUiIcon(name) {
  switch (name) {
    case 'satellite':
      return iconTile(TERMINAL_ICON_COLORS.cyan, `
        <rect x="8" y="8" width="4" height="4" rx="0.7" stroke="${TERMINAL_ICON_COLORS.cyan}" stroke-width="1.1"/>
        <path d="M7.1 7.1 4.9 4.9M12.9 7.1l2.2-2.2M7.1 12.9l-2.2 2.2M12.9 12.9l2.2 2.2M4.3 10h2.2M13.5 10h2.2M10 4.3v2.2M10 13.5v2.2" stroke="${TERMINAL_ICON_COLORS.cyan}" stroke-width="1.05" stroke-linecap="round"/>
      `);
    case 'cloud':
      return iconTile(TERMINAL_ICON_COLORS.green, `
        <path d="M5 12.5h9.3c1.5 0 2.7-1 2.7-2.4 0-1.3-1-2.3-2.4-2.4-.4-1.7-1.9-2.9-3.8-2.9-1.9 0-3.5 1.2-4 3C5.3 8 4 9.1 4 10.7 4 11.7 4.4 12.5 5 12.5Z" fill="rgba(0,255,65,0.08)" stroke="${TERMINAL_ICON_COLORS.green}" stroke-width="1.1" stroke-linejoin="round"/>
      `);
    case 'fire':
      return iconTile(TERMINAL_ICON_COLORS.orange, `
        <path d="M10.4 4.6c.3 1.2-.2 2.2-1 3.1-.7.8-1.5 1.5-1.5 2.8 0 1.6 1.2 2.8 2.8 2.8s2.8-1.2 2.8-2.9c0-1.5-.8-2.4-1.6-3.4-.7-.9-1.2-1.6-1.5-2.4Z" fill="rgba(255,139,61,0.18)" stroke="${TERMINAL_ICON_COLORS.orange}" stroke-width="1.1" stroke-linejoin="round"/>
        <path d="M10.4 8.6c.2.5 0 1-.3 1.4-.3.4-.7.8-.7 1.5 0 .8.6 1.5 1.5 1.5.8 0 1.4-.7 1.4-1.5 0-.8-.4-1.3-.8-1.8-.4-.4-.7-.8-1.1-1.1Z" fill="${TERMINAL_ICON_COLORS.orange}" opacity="0.85"/>
      `);
    case 'rain':
      return iconTile(TERMINAL_ICON_COLORS.cyan, `
        <path d="M5.2 11.1h8.9c1.5 0 2.7-.9 2.7-2.2 0-1.2-.9-2.1-2.1-2.2-.4-1.5-1.8-2.6-3.5-2.6-1.9 0-3.4 1.2-3.8 2.9-1.3.1-2.3 1.1-2.3 2.4 0 .9.4 1.7 1.1 2Z" fill="rgba(0,217,255,0.08)" stroke="${TERMINAL_ICON_COLORS.cyan}" stroke-width="1.05"/>
        <path d="M7.5 12.8l-.7 1.6M10 12.8l-.7 1.6M12.5 12.8l-.7 1.6" stroke="${TERMINAL_ICON_COLORS.cyan}" stroke-width="1.15" stroke-linecap="round"/>
      `);
    case 'globe':
      return iconTile(TERMINAL_ICON_COLORS.cyan, `
        <circle cx="10" cy="10" r="4.7" stroke="${TERMINAL_ICON_COLORS.cyan}" stroke-width="1.1"/>
        <path d="M5.7 10h8.6M10 5.3c1.2 1.3 1.9 2.9 1.9 4.7 0 1.8-.7 3.4-1.9 4.7M10 5.3C8.8 6.6 8.1 8.2 8.1 10c0 1.8.7 3.4 1.9 4.7" stroke="${TERMINAL_ICON_COLORS.cyan}" stroke-width="1.05" stroke-linecap="round"/>
      `);
    case 'plane':
      return iconTile(TERMINAL_ICON_COLORS.cyan, `
        <path d="M15.8 9.8 11.7 8V4.7a.9.9 0 0 0-1.8 0V8L5.8 9.8v1.1l4.1-.8v3l-1.2.9v.9l2.1-.7 2.1.7V14l-1.2-.9v-3l4.1.8V9.8Z" fill="${TERMINAL_ICON_COLORS.cyan}" stroke="${TERMINAL_ICON_COLORS.cyan}" stroke-width="0.5"/>
      `);
    case 'ship':
      return iconTile(TERMINAL_ICON_COLORS.green, `
        <path d="M5.2 12.5h9.6l-1.4-3.6h-1.2V7.3h-1.8V5.2H8.8v2.1H7v1.6H6l-.8 3.6Z" fill="rgba(0,255,65,0.15)" stroke="${TERMINAL_ICON_COLORS.green}" stroke-width="1.05"/>
        <path d="M5.1 14.4c.8.6 1.6.9 2.5.9s1.7-.3 2.4-.9c.7.6 1.6.9 2.5.9s1.7-.3 2.4-.9" stroke="${TERMINAL_ICON_COLORS.green}" stroke-width="1.05" stroke-linecap="round"/>
      `);
    case 'shield':
      return iconTile(TERMINAL_ICON_COLORS.red, `
        <path d="M10 4.5 14.7 6v3.6c0 2.2-1 4.2-4.7 6-3.7-1.8-4.7-3.8-4.7-6V6L10 4.5Z" fill="rgba(255,92,92,0.14)" stroke="${TERMINAL_ICON_COLORS.red}" stroke-width="1.1"/>
        <path d="M8 10h4M10 8v4" stroke="${TERMINAL_ICON_COLORS.red}" stroke-width="1.05" stroke-linecap="round"/>
      `);
    case 'radar':
      return iconTile(TERMINAL_ICON_COLORS.amber, `
        <circle cx="10" cy="10" r="4.5" stroke="${TERMINAL_ICON_COLORS.amber}" stroke-width="1.05"/>
        <circle cx="10" cy="10" r="2.1" stroke="${TERMINAL_ICON_COLORS.amber}" stroke-width="1.05" opacity="0.8"/>
        <path d="M10 10 14 7.5" stroke="${TERMINAL_ICON_COLORS.amber}" stroke-width="1.15" stroke-linecap="round"/>
        <circle cx="10" cy="10" r="1.2" fill="${TERMINAL_ICON_COLORS.amber}"/>
      `);
    case 'bolt':
      return iconTile(TERMINAL_ICON_COLORS.yellow, `
        <path d="M10.8 4.6 6.8 10h2.9l-.5 5.1 4-5.6h-2.9l.5-4.9Z" fill="${TERMINAL_ICON_COLORS.yellow}" stroke="${TERMINAL_ICON_COLORS.yellow}" stroke-width="0.6" stroke-linejoin="round"/>
      `);
    case 'quake':
      return iconTile(TERMINAL_ICON_COLORS.purple, `
        <circle cx="10" cy="10" r="4.5" stroke="${TERMINAL_ICON_COLORS.purple}" stroke-width="1.05"/>
        <path d="M5.6 10h1.6l1-1.6 1.2 3.4 1.3-2h3.1" stroke="${TERMINAL_ICON_COLORS.purple}" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"/>
      `);
    case 'cable':
      return iconTile(TERMINAL_ICON_COLORS.purple, `
        <path d="M5 10c1.8-2.8 4.2-2.8 6 0s4.2 2.8 6 0" stroke="${TERMINAL_ICON_COLORS.purple}" stroke-width="1.2" fill="none" stroke-linecap="round"/>
        <circle cx="5" cy="10" r="1.2" fill="${TERMINAL_ICON_COLORS.purple}"/>
        <circle cx="15" cy="10" r="1.2" fill="${TERMINAL_ICON_COLORS.purple}"/>
      `);
    case 'alert':
      return iconTile(TERMINAL_ICON_COLORS.amber, `
        <path d="M10 4.2 15.2 14H4.8L10 4.2Z" fill="rgba(255,176,0,0.15)" stroke="${TERMINAL_ICON_COLORS.amber}" stroke-width="1.1" stroke-linejoin="round"/>
        <path d="M10 7.4v3.3" stroke="${TERMINAL_ICON_COLORS.amber}" stroke-width="1.15" stroke-linecap="round"/>
        <circle cx="10" cy="12.4" r="0.9" fill="${TERMINAL_ICON_COLORS.amber}"/>
      `);
    default:
      return iconTile(TERMINAL_ICON_COLORS.green, `<circle cx="10" cy="10" r="3" fill="${TERMINAL_ICON_COLORS.green}"/>`);
  }
}

function hydrateLayerIcons() {
  document.querySelectorAll('.layer-icon[data-icon]').forEach(el => {
    el.innerHTML = buildUiIcon(el.dataset.icon);
    el.setAttribute('aria-hidden', 'true');
  });
}

hydrateLayerIcons();

function svgIcon(svgContent, size = 24, color = '#00ff41') {
  return L.divIcon({
    className: 'tactical-icon',
    html: `<div class="map-marker-shell" style="width:${size}px;height:${size}px;filter:drop-shadow(0 0 5px ${color});">${svgContent}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2]
  });
}

function makeHexMarker(inner, accent = TERMINAL_ICON_COLORS.green) {
  return `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 2.75 33 10.25v15.5L20 33.25 7 25.75v-15.5L20 2.75Z" fill="#06110b" fill-opacity="0.96" stroke="${accent}" stroke-width="1.7"/>
    <path d="M12 8.75h16" stroke="${accent}" stroke-opacity="0.45" stroke-width="1.2"/>
    <g transform="translate(8 8)">${inner}</g>
  </svg>`;
}

function makeTriangleMarker(label, accent) {
  return `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 4 36 31H4L20 4Z" fill="#120707" fill-opacity="0.95" stroke="${accent}" stroke-width="1.8" stroke-linejoin="round"/>
    <path d="M12 27.5h16" stroke="${accent}" stroke-opacity="0.4" stroke-width="1.1"/>
    <path d="M20 9.8 22.2 14h-4.4L20 9.8Z" fill="${accent}" opacity="0.9"/>
    <text x="20" y="22.2" text-anchor="middle" fill="${accent}" font-size="8.2" font-weight="700" font-family="JetBrains Mono, monospace">${label}</text>
  </svg>`;
}

const planeCoreSvg = `<path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" fill="${TERMINAL_ICON_COLORS.cyan}" stroke="${TERMINAL_ICON_COLORS.cyan}" stroke-width="0.7"/>`;
const fighterCoreSvg = `<path d="M22 12 16 9l-3-7-2 7-6 2 6 2 2 7 3-7 6-3Z" fill="${TERMINAL_ICON_COLORS.cyan}" stroke="${TERMINAL_ICON_COLORS.cyan}" stroke-width="0.7"/><path d="M2.5 12h4" stroke="${TERMINAL_ICON_COLORS.cyan}" stroke-width="1.5" stroke-linecap="round"/>`;
const shipCoreSvg = `<path d="M2.8 18.2h18.4l-2.7-6.6h-1.8V8h-2.8V4.8h-3.8V8H7.2v3.6H5.5l-2.7 6.6Z" fill="rgba(0,255,65,0.14)" stroke="${TERMINAL_ICON_COLORS.green}" stroke-width="0.8"/><path d="M3.5 20.4c1.1.8 2.3 1.2 3.6 1.2 1.3 0 2.5-.4 3.6-1.2 1.1.8 2.3 1.2 3.6 1.2 1.3 0 2.5-.4 3.6-1.2" stroke="${TERMINAL_ICON_COLORS.green}" stroke-width="1.2" stroke-linecap="round"/>`;
const warshipCoreSvg = `<path d="M2 18.1h20l-3.8-7.1h-1.9V8h-3V5h-2.8v3H7.6v3H5.8L2 18.1Z" fill="rgba(255,176,0,0.12)" stroke="${TERMINAL_ICON_COLORS.amber}" stroke-width="0.85"/><path d="M7.6 8h8.8M12 5v3" stroke="${TERMINAL_ICON_COLORS.amber}" stroke-width="1.1" stroke-linecap="round"/><circle cx="12" cy="14" r="1.6" fill="${TERMINAL_ICON_COLORS.amber}"/>`;
const movementCoreSvg = `<circle cx="12" cy="12" r="8.2" stroke="${TERMINAL_ICON_COLORS.amber}" stroke-width="1.6" stroke-dasharray="3 2"/><circle cx="12" cy="12" r="3.7" fill="rgba(255,176,0,0.18)" stroke="${TERMINAL_ICON_COLORS.amber}" stroke-width="1.2"/><path d="M12 12 17 9" stroke="${TERMINAL_ICON_COLORS.amber}" stroke-width="1.3" stroke-linecap="round"/><circle cx="12" cy="12" r="1.4" fill="${TERMINAL_ICON_COLORS.amber}"/>`;
const powerCoreSvg = `<path d="M13 2.2 4.3 12.9h6.2l-.8 8.9 8.8-11.2h-6.1l.6-8.4Z" fill="${TERMINAL_ICON_COLORS.yellow}" stroke="${TERMINAL_ICON_COLORS.yellow}" stroke-width="0.7" stroke-linejoin="round"/>`;
const refineryCoreSvg = `<rect x="4.8" y="11" width="14.4" height="9.7" fill="rgba(255,139,61,0.14)" stroke="${TERMINAL_ICON_COLORS.orange}" stroke-width="0.85"/><rect x="7.3" y="6.8" width="2.6" height="4.2" fill="rgba(255,139,61,0.14)" stroke="${TERMINAL_ICON_COLORS.orange}" stroke-width="0.85"/><rect x="14.1" y="4.8" width="2.8" height="6.2" fill="rgba(255,139,61,0.14)" stroke="${TERMINAL_ICON_COLORS.orange}" stroke-width="0.85"/>`;
const miningCoreSvg = `<path d="M4 19.8h16l-4-7.3-4 3.7-4-3.7-4 7.3Z" fill="rgba(159,182,194,0.14)" stroke="${TERMINAL_ICON_COLORS.steel}" stroke-width="0.85"/><path d="M8 12.4 12 6.5l4 5.9" stroke="${TERMINAL_ICON_COLORS.steel}" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>`;
const portCoreSvg = `<path d="M12 3.1c-4 0-6.8 2.8-6.8 6 0 2.7 1.5 4.6 3.8 5.8v3.8h6v-3.8c2.3-1.2 3.8-3.1 3.8-5.8 0-3.2-2.8-6-6.8-6Z" fill="rgba(0,217,255,0.12)" stroke="${TERMINAL_ICON_COLORS.cyan}" stroke-width="0.85"/><path d="M9 19.2h6v1.7H9Z" fill="${TERMINAL_ICON_COLORS.cyan}"/>`;
const sigintCoreSvg = `<circle cx="12" cy="12" r="8.6" stroke="${TERMINAL_ICON_COLORS.purple}" stroke-width="1.3"/><circle cx="12" cy="12" r="3.2" fill="${TERMINAL_ICON_COLORS.purple}" opacity="0.92"/><path d="M12 4.8v2.3M12 16.9v2.3M4.8 12h2.3M16.9 12h2.3" stroke="${TERMINAL_ICON_COLORS.purple}" stroke-width="1.1" stroke-linecap="round"/>`;
const defaultAssetCoreSvg = `<path d="m12 3.5 2.6 5.2 5.7.8-4.1 4 1 5.7L12 16.4 6.8 19.2l1-5.7-4-4 5.7-.8L12 3.5Z" fill="rgba(0,255,65,0.15)" stroke="${TERMINAL_ICON_COLORS.green}" stroke-width="0.85"/>`;
const cableCoreSvg = `<path d="M4 12c4.2-5.8 11.8 5.8 16 0" stroke="${TERMINAL_ICON_COLORS.purple}" stroke-width="1.8" fill="none" stroke-linecap="round"/><circle cx="4" cy="12" r="2" fill="${TERMINAL_ICON_COLORS.purple}"/><circle cx="20" cy="12" r="2" fill="${TERMINAL_ICON_COLORS.purple}"/>`;
const advisoryCoreSvg = `<path d="M12 3 21 19H3L12 3Z" fill="rgba(255,176,0,0.14)" stroke="${TERMINAL_ICON_COLORS.amber}" stroke-width="1"/><path d="M12 8v5" stroke="${TERMINAL_ICON_COLORS.amber}" stroke-width="1.4" stroke-linecap="round"/><circle cx="12" cy="15.7" r="1.15" fill="${TERMINAL_ICON_COLORS.amber}"/>`;

const planeIcon = svgIcon(makeHexMarker(planeCoreSvg, TERMINAL_ICON_COLORS.cyan), 28, TERMINAL_ICON_COLORS.cyan);
const fighterIcon = svgIcon(makeHexMarker(fighterCoreSvg, TERMINAL_ICON_COLORS.cyan), 28, TERMINAL_ICON_COLORS.cyan);
const shipIcon = svgIcon(makeHexMarker(shipCoreSvg, TERMINAL_ICON_COLORS.green), 26, TERMINAL_ICON_COLORS.green);
const priorityShipIcon = svgIcon(makeHexMarker(warshipCoreSvg, TERMINAL_ICON_COLORS.amber), 28, TERMINAL_ICON_COLORS.amber);
const warshipIcon = svgIcon(makeHexMarker(warshipCoreSvg, TERMINAL_ICON_COLORS.amber), 26, TERMINAL_ICON_COLORS.amber);

const baseIconCuba = svgIcon(makeTriangleMarker('CU', TERMINAL_ICON_COLORS.red), 30, TERMINAL_ICON_COLORS.red);
const baseIconUS = svgIcon(makeTriangleMarker('US', TERMINAL_ICON_COLORS.cyan), 30, TERMINAL_ICON_COLORS.cyan);
const baseIconNATO = svgIcon(makeTriangleMarker('NAT', TERMINAL_ICON_COLORS.amber), 30, TERMINAL_ICON_COLORS.amber);
const movementIcon = svgIcon(makeHexMarker(movementCoreSvg, TERMINAL_ICON_COLORS.amber), 28, TERMINAL_ICON_COLORS.amber);
const cableIcon = svgIcon(makeHexMarker(cableCoreSvg, TERMINAL_ICON_COLORS.purple), 26, TERMINAL_ICON_COLORS.purple);
const advisoryIcon = svgIcon(makeHexMarker(advisoryCoreSvg, TERMINAL_ICON_COLORS.amber), 26, TERMINAL_ICON_COLORS.amber);

const assetIcons = {
  power_plant: svgIcon(makeHexMarker(powerCoreSvg, TERMINAL_ICON_COLORS.yellow), 26, TERMINAL_ICON_COLORS.yellow),
  refinery: svgIcon(makeHexMarker(refineryCoreSvg, TERMINAL_ICON_COLORS.orange), 26, TERMINAL_ICON_COLORS.orange),
  oil_field: svgIcon(makeHexMarker(refineryCoreSvg, TERMINAL_ICON_COLORS.orange), 26, TERMINAL_ICON_COLORS.orange),
  mining: svgIcon(makeHexMarker(miningCoreSvg, TERMINAL_ICON_COLORS.steel), 26, TERMINAL_ICON_COLORS.steel),
  port: svgIcon(makeHexMarker(portCoreSvg, TERMINAL_ICON_COLORS.cyan), 26, TERMINAL_ICON_COLORS.cyan),
  sigint: svgIcon(makeHexMarker(sigintCoreSvg, TERMINAL_ICON_COLORS.purple), 26, TERMINAL_ICON_COLORS.purple),
};
const assetIconDefault = svgIcon(makeHexMarker(defaultAssetCoreSvg, TERMINAL_ICON_COLORS.green), 26, TERMINAL_ICON_COLORS.green);

const underseaCableFeatures = [
  { name: "ALBA-1 cable landing area", lat: 19.964, lon: -75.728, type: "undersea_cable", description: "Public OSINT context marker for Cuba's primary international fiber path near eastern Cuba. Exact landing and route should be verified against current telecom/cable sources." },
  { name: "ALBA-1 route context", lat: 18.55, lon: -73.95, type: "undersea_cable_route", description: "Approximate Cuba-to-Caribbean cable corridor context. Drawn for orientation only, not a surveyed cable path." },
];

const advisoryMarkers = [
  { name: "Embassy / travel advisory monitor", lat: 23.1136, lon: -82.3666, type: "travel_advisory", description: "Placeholder context for U.S./Canada/UK/Spain/EU advisory monitoring. Connect this to advisory scrapers later." },
  { name: "Hurricane/disaster watch centroid", lat: 21.8, lon: -79.5, type: "disaster_watch", description: "Use NASA GIBS precip/cloud overlays with weather feeds for hurricane/disaster mode." },
];

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  return res.json();
}

function setStale(elId, stale) {
  const el = document.getElementById(elId);
  if (el) el.classList.toggle("visible", !!stale);
}

function setDot(elId, color, title = "") {
  const el = document.getElementById(elId);
  if (!el) return;
  el.className = "dot " + color;
  if (title) {
    el.title = title;
    el.closest(".stat-badge")?.setAttribute("title", title);
  }
}

function ageOpacity(ts) {
  if (!ts) return 0.35;
  const then = new Date(ts);
  if (Number.isNaN(then.getTime())) return 0.35;
  const ageMin = Math.max(0, (Date.now() - then.getTime()) / 60000);
  if (ageMin <= 15) return 1;
  if (ageMin <= 60) return 0.65;
  if (ageMin <= 240) return 0.35;
  return 0.18;
}

function shipPriority(s) {
  const mmsi = String(s.mmsi || "");
  const shipType = String(s.ship_type || "").toUpperCase();
  const isTankerLike = shipType.includes("TANKER") || shipType.includes("CARGO") || shipType.includes("OIL");
  if (mmsi.startsWith("775") && isTankerLike) return "VENEZUELA_FUEL_LINK";
  if (mmsi.startsWith("273") && isTankerLike) return "RUSSIA_FUEL_LINK";
  return "";
}

function sourceRow(source, fetchedAt) {
  return `
    <div class="row"><span>SOURCE</span><span>${escapeHtml(source || "—")}</span></div>
    <div class="row"><span>FETCHED</span><span>${formatDate(fetchedAt)}</span></div>`;
}

async function loadFlights() {
  try {
    const res = await fetchJSON("/api/flights");
    flightLayer.clearLayers();
    (res.data || []).forEach(f => {
      if (f.lat == null || f.lon == null) return;
      const m = L.marker([f.lat, f.lon], { icon: planeIcon });
      m.setOpacity(ageOpacity(f.fetched_at));
      m.bindPopup(
        `<div class="flight-popup">
          <strong>> ${f.callsign || f.icao}</strong>
          <div class="row"><span>ICAO</span><span>${f.icao}</span></div>
          <div class="row"><span>ALTITUDE</span><span>${f.altitude || "—"} FT</span></div>
          <div class="row"><span>SPEED</span><span>${f.speed || "—"} KT</span></div>
          <div class="row"><span>HEADING</span><span>${f.heading || "—"}°</span></div>
          <div class="row"><span>TYPE</span><span>${f.aircraft_type || "—"}</span></div>
          ${sourceRow(f.source, f.fetched_at)}
        </div>`
      );
      flightLayer.addLayer(m);
    });
    document.getElementById("stat-flights").textContent = res.count || 0;
    setDot("dot-flights", res.stale ? "yellow" : (res.count ? "green" : "grey"));
  } catch (e) {
    console.error("[ERROR] ADS-B FEED FAILURE:", e);
    setDot("dot-flights", "red");
  }
}

async function loadShips() {
  try {
    const res = await fetchJSON("/api/ships");
    shipLayer.clearLayers();
    (res.data || []).forEach(s => {
      if (s.lat == null || s.lon == null) return;
      const priority = shipPriority(s);
      const m = L.marker([s.lat, s.lon], { icon: priority ? priorityShipIcon : shipIcon });
      m.setOpacity(ageOpacity(s.fetched_at));
      m.bindPopup(
        `<div class="ship-popup">
          <strong>> ${s.name || "UNKNOWN VESSEL"}</strong>
          ${priority ? `<div class="row"><span>PRIORITY</span><span>${priority}</span></div>` : ""}
          <div class="row"><span>MMSI</span><span>${s.mmsi}</span></div>
          <div class="row"><span>SPEED</span><span>${s.speed != null ? s.speed + " KN" : "—"}</span></div>
          <div class="row"><span>HEADING</span><span>${s.heading != null ? s.heading + "°" : "—"}</span></div>
          <div class="row"><span>TYPE</span><span>${s.ship_type || "—"}</span></div>
          <div class="row"><span>FLAG</span><span>${s.flag || "—"}</span></div>
          ${sourceRow(s.source, s.fetched_at)}
        </div>`
      );
      shipLayer.addLayer(m);
    });
    document.getElementById("stat-ships").textContent = res.count || 0;
    setDot("dot-ships", res.stale ? "yellow" : (res.count ? "green" : "grey"));
  } catch (e) {
    console.error("[ERROR] AIS FEED FAILURE:", e);
    setDot("dot-ships", "red");
  }
}

function seismicColor(mag) {
  if (mag == null) return "#888";
  if (mag >= 5) return "#ff3333";
  if (mag >= 3.5) return "#ffb000";
  return "#00ffff";
}

async function loadSeismic() {
  try {
    const res = await fetchJSON("/api/seismic");
    seismicLayer.clearLayers();
    (res.data || []).forEach(ev => {
      if (ev.lat == null || ev.lon == null) return;
      const mag = ev.magnitude == null ? null : Number(ev.magnitude);
      const color = seismicColor(mag);
      const radius = Math.max(5, Math.min(18, 5 + (mag || 1) * 2.2));
      const opacity = ageOpacity(ev.fetched_at);
      const m = L.circleMarker([ev.lat, ev.lon], {
        radius,
        color,
        weight: 2,
        fillColor: color,
        fillOpacity: Math.max(0.18, opacity * 0.45),
        opacity,
      });
      m.bindPopup(
        `<div class="flight-popup">
          <strong>> ${escapeHtml(ev.title || "SEISMIC EVENT")}</strong>
          <div class="row"><span>MAG</span><span>${mag != null ? mag.toFixed(1) : "—"}</span></div>
          <div class="row"><span>DEPTH</span><span>${ev.depth_km != null ? Number(ev.depth_km).toFixed(1) + " KM" : "—"}</span></div>
          <div class="row"><span>PLACE</span><span>${escapeHtml(ev.place || "—")}</span></div>
          <div class="row"><span>TIME</span><span>${formatDate(ev.event_time)}</span></div>
          ${sourceRow(ev.source || "USGS all-day GeoJSON", ev.fetched_at)}
        </div>`
      );
      seismicLayer.addLayer(m);
    });
    document.getElementById("stat-seismic").textContent = res.count || 0;
    setDot("dot-seismic", res.stale ? "yellow" : (res.count ? "cyan" : "grey"));
  } catch (e) {
    console.error("[ERROR] USGS SEISMIC FEED FAILURE:", e);
    setDot("dot-seismic", "red");
  }
}

function levelColor(level) {
  if (level === "red") return "red";
  if (level === "yellow") return "yellow";
  if (level === "green") return "green";
  return "grey";
}

function sparkline(values) {
  const sample = (values || []).slice(-36);
  const numeric = sample.filter(v => typeof v === "number");
  const max = numeric.length ? Math.max(...numeric) : 0;
  if (!sample.length || max <= 0) {
    return '<div class="connectivity-sparkline"><span class="missing"></span></div>';
  }
  const bars = sample.map(v => {
    if (typeof v !== "number") return '<span class="missing"></span>';
    const h = Math.max(2, Math.round((v / max) * 20));
    return `<span style="height:${h}px"></span>`;
  }).join("");
  return `<div class="connectivity-sparkline" title="Latest IODA signal samples">${bars}</div>`;
}

async function loadConnectivity() {
  try {
    const res = await fetchJSON("/api/ioda");
    const panel = document.getElementById("connectivity-content");
    const d = res.data;
    if (!d) {
      panel.innerHTML = '<div class="loading-text">> NO IODA CONNECTIVITY DATA</div>';
      document.getElementById("stat-ioda").textContent = "UNKNOWN";
      setDot("dot-ioda", "grey");
      setStale("ioda-stale", true);
      return;
    }
    const primary = (d.signals || []).find(s => s.datasource === "bgp")
      || (d.signals || []).find(s => s.datasource === "ping-slash24")
      || (d.signals || [])[0];
    const signalRows = (d.signals || []).slice(0, 3).map(s => `
      <div class="connectivity-signal">
        <span>${escapeHtml(s.label || s.datasource)}</span>
        <span><b>${s.current ?? "—"}</b>${s.drop_percent != null ? ` / -${s.drop_percent}%` : ""}</span>
      </div>`).join("");
    panel.innerHTML = `
      <div class="connectivity-summary">
        <div class="energy-indicator ${levelColor(d.level)}"></div>
        <div>
          <div class="connectivity-status">${escapeHtml(d.status || "UNKNOWN")}</div>
          <div class="connectivity-source">${escapeHtml(d.entity || "ASN 27725")}</div>
        </div>
      </div>
      ${sparkline(primary?.values || [])}
      <div class="connectivity-notes">${escapeHtml(d.notes || "")}</div>
      ${signalRows}`;
    document.getElementById("stat-ioda").textContent = d.status || "—";
    setDot("dot-ioda", res.stale ? "yellow" : levelColor(d.level), `${d.source || "IODA"} // ${d.notes || ""}`);
    setStale("ioda-stale", res.stale);
  } catch (e) {
    console.error("[ERROR] IODA CONNECTIVITY FEED FAILURE:", e);
    setDot("dot-ioda", "red");
  }
}

async function loadNews() {
  try {
    const res = await fetchJSON("/api/news");
    const container = document.getElementById("news-list");
    container.innerHTML = "";
    if (!res.data || res.data.length === 0) {
      container.innerHTML = '<div class="loading-text">> NO NEWS SIGNALS DETECTED</div>';
    } else {
      res.data.forEach(n => {
        const item = document.createElement("div");
        item.className = "news-item";
        item.onclick = () => window.open(n.url, "_blank");
        item.innerHTML = `
          <div class="news-meta">
            <span class="news-source">${n.source}</span>
            <span>${formatDate(n.published)}</span>
          </div>
          <div class="news-title">${escapeHtml(n.title)}</div>`;
        container.appendChild(item);
      });
    }
    document.getElementById("stat-news").textContent = res.count || 0;
    setDot("dot-news", res.stale ? "yellow" : (res.count ? "green" : "grey"));
    setStale("news-stale", res.stale);
  } catch (e) {
    console.error("[ERROR] NEWS FEED FAILURE:", e);
    setDot("dot-news", "red");
  }
}

async function loadWeather() {
  try {
    const res = await fetchJSON("/api/weather");
    const d = res.data;
    const el = document.getElementById("weather-content");
    if (!d) {
      el.innerHTML = '<div class="loading-text">> NO SATELLITE DATA</div>';
      return;
    }
    el.innerHTML = `
      <div class="weather-main">
        <div class="weather-temp">${d.temperature != null ? Math.round(d.temperature) + "°C" : "—"}</div>
        <div>
          <div class="weather-desc">${d.description || "—"}</div>
          <div class="weather-desc" style="font-size:0.7rem;">APPARENT: ${d.apparent_temperature != null ? Math.round(d.apparent_temperature) + "°" : "—"}</div>
        </div>
      </div>
      <div class="weather-grid">
        <div class="weather-item"><div class="label">HUMIDITY</div><div class="value">${d.humidity != null ? d.humidity + "%" : "—"}</div></div>
        <div class="weather-item"><div class="label">WIND</div><div class="value">${d.wind_speed != null ? d.wind_speed + " KM/H" : "—"}</div></div>
        <div class="weather-item"><div class="label">DIRECTION</div><div class="value">${d.wind_direction != null ? d.wind_direction + "°" : "—"}</div></div>
        <div class="weather-item"><div class="label">PRECIP</div><div class="value">${d.precipitation != null ? d.precipitation + " MM" : "—"}</div></div>
      </div>`;
    setStale("weather-stale", res.stale);
  } catch (e) {
    console.error("[ERROR] METEOROLOGICAL FEED FAILURE:", e);
  }
}

async function loadEnergy() {
  try {
    const res = await fetchJSON("/api/energy");
    const d = res.data;
    const ind = document.getElementById("energy-indicator");
    if (!d) {
      ind.className = "energy-indicator grey";
      document.getElementById("energy-status").textContent = "UNKNOWN";
      return;
    }
    ind.className = `energy-indicator ${d.level || "grey"}`;
    document.getElementById("energy-status").textContent = d.status || "UNKNOWN";
    document.getElementById("energy-notes").textContent =
      `${d.outage_reports || 0} OUTAGE REPORTS // ${d.notes || ""}`;
    document.getElementById("stat-energy").textContent = d.status || "—";
    setDot("dot-energy", d.level || "grey");
    setStale("energy-stale", res.stale);
  } catch (e) {
    console.error("[ERROR] ENERGY GRID FEED FAILURE:", e);
    setDot("dot-energy", "red");
  }
}

const healthDotIds = {
  flights: "dot-flights",
  ships: "dot-ships",
  news: "dot-news",
  energy: "dot-energy",
  seismic: "dot-seismic",
  ioda: "dot-ioda",
  military: "dot-military",
};

function healthTitle(h) {
  const parts = [
    h.label || h.key,
    `status=${h.status || "unknown"}`,
    h.active_source ? `source=${h.active_source}` : "",
    h.last_success ? `last_success=${formatDate(h.last_success)}` : "",
    h.last_error ? `last_error=${h.last_error}` : "",
  ].filter(Boolean);
  return parts.join(" // ");
}

async function loadSources() {
  try {
    const res = await fetchJSON("/api/sources");
    const list = document.getElementById("source-health-list");
    if (list) {
      list.innerHTML = (res.data || []).map(h => {
        const status = h.status === "ok" ? "ok" : "error";
        return `<div class="source-health-row"><div><div class="source-name">${escapeHtml(h.label || h.key)}</div><div class="source-meta">${escapeHtml(h.active_source || "unknown")} // ${h.last_success ? formatDate(h.last_success) : "never"}</div></div><span class="source-badge ${status}">${escapeHtml(h.status || "unknown")}</span></div>`;
      }).join("") || `<div class="loading-text">> NO SOURCE HEALTH DATA</div>`;
    }
    (res.data || []).forEach(h => {
      const dotId = healthDotIds[h.key];
      if (!dotId) return;
      const el = document.getElementById(dotId);
      if (!el) return;
      const title = healthTitle(h);
      el.title = title;
      el.closest(".stat-badge")?.setAttribute("title", title);
      if (h.status === "error") setDot(dotId, "red", title);
    });
  } catch (e) {
    console.error("[ERROR] SOURCE HEALTH FEED FAILURE:", e);
  }
}
function formatDate(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    if (isNaN(d)) return iso.slice(0, 16);
    const now = new Date();
    const diffMin = Math.floor((now - d) / 60000);
    if (diffMin < 1) return "T+0M";
    if (diffMin < 60) return `T+${diffMin}M`;
    if (diffMin < 1440) return `T+${Math.floor(diffMin / 60)}H`;
    return `T+${Math.floor(diffMin / 1440)}D`;
  } catch { return ""; }
}

function escapeHtml(s) {
  if (!s) return "";
  return String(s).replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}

function loadContextLayers() {
  cableLayer.clearLayers();
  underseaCableFeatures.forEach(c => {
    const marker = L.marker([c.lat, c.lon], { icon: cableIcon });
    marker.bindPopup(`<div class="flight-popup"><strong>> ${escapeHtml(c.name)}</strong><div class="row"><span>TYPE</span><span>${escapeHtml(c.type)}</span></div><div class="row" style="display:block; color:var(--text); margin-top:4px;">${escapeHtml(c.description)}</div><div class="row"><span>CONFIDENCE</span><span>context marker / verify</span></div></div>`);
    cableLayer.addLayer(marker);
  });
  const cableRoute = L.polyline([[19.964, -75.728], [19.1, -74.9], [18.55, -73.95], [18.25, -72.7]], {
    color: "#b56cff",
    weight: 2,
    opacity: 0.75,
    dashArray: "6 6",
  }).bindPopup("<b>ALBA-1 approximate cable corridor</b><br>OSINT context only. Not a precise surveyed route.");
  cableLayer.addLayer(cableRoute);

  advisoryLayer.clearLayers();
  advisoryMarkers.forEach(a => {
    const marker = L.marker([a.lat, a.lon], { icon: advisoryIcon });
    marker.bindPopup(`<div class="flight-popup"><strong>> ${escapeHtml(a.name)}</strong><div class="row"><span>TYPE</span><span>${escapeHtml(a.type)}</span></div><div class="row" style="display:block; color:var(--text); margin-top:4px;">${escapeHtml(a.description)}</div></div>`);
    advisoryLayer.addLayer(marker);
  });
}

async function loadMilitaryBases() {
  try {
    const res = await fetchJSON("/api/military/bases");
    basesLayer.clearLayers();
    (res.data || []).forEach(b => {
      if (b.lat == null || b.lon == null) return;
      const icon = b.country === "US" ? baseIconUS : b.country === "JM" || b.country === "BS" ? baseIconNATO : baseIconCuba;
      const m = L.marker([b.lat, b.lon], { icon });
      m.bindPopup(
        `<div class="flight-popup">
          <strong>> ${escapeHtml(b.name)}</strong>
          <div class="row"><span>COUNTRY</span><span>${b.country || "—"}</span></div>
          <div class="row"><span>TYPE</span><span>${b.type || "—"}</span></div>
          <div class="row" style="display:block; color:var(--text); margin-top:4px;">${escapeHtml(b.description || "")}</div>
        </div>`
      );
      basesLayer.addLayer(m);
    });
  } catch (e) {
    console.error("[ERROR] MILITARY BASES FEED FAILURE:", e);
  }
}

async function loadStrategicAssets() {
  try {
    const res = await fetchJSON("/api/strategic/assets");
    assetsLayer.clearLayers();
    (res.data || []).forEach(a => {
      if (a.lat == null || a.lon == null) return;
      const icon = assetIcons[a.type] || assetIconDefault;
      const m = L.marker([a.lat, a.lon], { icon });
      m.bindPopup(
        `<div class="flight-popup">
          <strong>> ${escapeHtml(a.name)}</strong>
          <div class="row"><span>TYPE</span><span>${a.type || "—"}</span></div>
          <div class="row"><span>IMPORTANCE</span><span>${a.importance || "—"}</span></div>
          <div class="row" style="display:block; color:var(--text); margin-top:4px;">${escapeHtml(a.description || "")}</div>
        </div>`
      );
      assetsLayer.addLayer(m);
    });
  } catch (e) {
    console.error("[ERROR] STRATEGIC ASSETS FEED FAILURE:", e);
  }
}

async function loadMovements() {
  try {
    const res = await fetchJSON("/api/military/movements");
    movementsLayer.clearLayers();
    const list = document.getElementById("movements-list");
    list.innerHTML = "";

    (res.data || []).forEach(mv => {
      if (mv.lat != null && mv.lon != null) {
        const m = L.marker([mv.lat, mv.lon], { icon: movementIcon });
        m.bindPopup(
          `<div class="flight-popup">
            <strong>> ${escapeHtml(mv.type || "MOVEMENT")}</strong>
            <div class="row" style="display:block; color:var(--text);">${escapeHtml(mv.description || "")}</div>
            <div class="row"><span>CONFIDENCE</span><span>${mv.confidence || "—"}</span></div>
            <div class="row"><span>TIME</span><span>${formatDate(mv.timestamp)}</span></div>
          </div>`
        );
        movementsLayer.addLayer(m);
      }

      const item = document.createElement("div");
      item.className = "news-item";
      item.innerHTML = `
        <div class="news-meta">
          <span class="news-source">${escapeHtml(mv.type || "ALERT")}</span>
          <span>${formatDate(mv.timestamp)}</span>
        </div>
        <div class="news-title">${escapeHtml(mv.description || "")}</div>`;
      list.appendChild(item);
    });

    if (!res.data || res.data.length === 0) {
      list.innerHTML = '<div class="loading-text">> NO ACTIVE ALERTS</div>';
    }
    document.getElementById("stat-movements").textContent = res.count || 0;
    setDot("dot-military", (res.count ? "yellow" : "green"));
  } catch (e) {
    console.error("[ERROR] MOVEMENT INDICATORS FEED FAILURE:", e);
    setDot("dot-military", "red");
  }
}

async function loadBriefing() {
  try {
    const res = await fetchJSON("/api/briefing");
    const el = document.getElementById("briefing-content");
    const risk = res.risk || {};
    const drivers = (risk.drivers || []).slice(0, 4).map(d =>
      `<div class="driver-row"><span>+${d.impact || 0} ${escapeHtml(d.label || "Signal")}</span><span>${escapeHtml(d.detail || "")}</span></div>`
    ).join("");
    el.innerHTML = `
      <div class="risk-card risk-${(risk.color || "grey")}">
        <div>
          <div class="risk-label">SITUATION LEVEL</div>
          <div class="risk-level">${escapeHtml(risk.level || "UNKNOWN")}</div>
        </div>
        <div class="risk-score">${risk.score ?? 0}<span>/100</span></div>
      </div>
      <div class="briefing-summary">${escapeHtml(res.summary || "No briefing available.")}</div>
      <div class="briefing-meta">CONFIDENCE: ${escapeHtml(res.confidence || "Unknown")} // GENERATED ${formatDate(res.generated_at)}</div>
      <div class="driver-list">${drivers || '<div class="driver-row"><span>No elevated drivers</span><span>—</span></div>'}</div>`;
  } catch (e) {
    console.error("[ERROR] BRIEFING FAILURE:", e);
  }
}

async function loadEvents() {
  try {
    const res = await fetchJSON("/api/events");
    const el = document.getElementById("event-list");
    const events = res.data || [];
    if (!events.length) {
      el.innerHTML = '<div class="loading-text">> NO NORMALIZED EVENTS</div>';
      return;
    }
    el.innerHTML = events.slice(0, 12).map(ev => `
      <div class="event-item event-${escapeHtml(ev.severity || "low")}" ${ev.source_url ? `onclick="window.open('${escapeHtml(ev.source_url)}','_blank')"` : ""}>
        <div class="event-meta"><span>${escapeHtml(ev.category || "event")}</span><span>${formatDate(ev.observed_at)}</span></div>
        <div class="event-title">${escapeHtml(ev.title || "Untitled event")}</div>
        <div class="event-desc">${escapeHtml(ev.description || "")}</div>
      </div>`).join("");
  } catch (e) {
    console.error("[ERROR] EVENT TIMELINE FAILURE:", e);
  }
}

function exportBrief() {
  window.open("/api/export/brief.md", "_blank");
}
window.exportBrief = exportBrief;


async function loadSignalRadar() {
  try {
    const res = await fetchJSON("/api/radar");
    const el = document.getElementById("signal-radar");
    if (!el) return;
    el.innerHTML = (res.signals || []).slice(0, 7).map(sig => `
      <div class="radar-row">
        <div class="radar-head"><span>${escapeHtml(sig.label)}</span><span class="radar-score">${sig.score}/100</span></div>
        <div class="radar-bar"><div class="radar-fill" style="width:${Math.max(3, Math.min(100, sig.score || 0))}%"></div></div>
        <div class="radar-detail">${escapeHtml(sig.direction || "stable").toUpperCase()} // ${escapeHtml(sig.detail || "")}</div>
      </div>`).join("");
  } catch (e) { console.error("[ERROR] SIGNAL RADAR FAILURE:", e); }
}

async function loadWatchMode() {
  try {
    const res = await fetchJSON("/api/watch-mode");
    const el = document.getElementById("watch-mode");
    if (!el) return;
    el.innerHTML = `
      <div class="watch-row ${res.active_count ? "active" : ""}">
        <div class="watch-head"><span>WATCH MODE: ${escapeHtml(res.status || "ACTIVE")}</span><span>${res.active_count || 0} TRIGGERED</span></div>
        <div class="watch-detail">Scan interval ${res.scan_interval_minutes || 15}m // threshold ${escapeHtml(res.minimum_alert_level || "WATCH")}</div>
      </div>` + (res.conditions || []).map(c => `
      <div class="watch-row ${c.active ? "active" : ""}">
        <div class="watch-head"><span>${escapeHtml(c.label)}</span><span class="watch-pill ${c.active ? "triggered" : ""}">${c.active ? "TRIGGERED" : "CLEAR"}</span></div>
        <div class="watch-detail">${escapeHtml(c.detail || "")}</div>
      </div>`).join("");
  } catch (e) { console.error("[ERROR] WATCH MODE FAILURE:", e); }
}

async function loadDiscoveries() {
  try {
    const res = await fetchJSON("/api/discoveries");
    const el = document.getElementById("discovery-queue");
    if (!el) return;
    el.innerHTML = (res.discoveries || []).slice(0, 8).map(d => `
      <div class="discovery-row ${escapeHtml(d.severity || "low")}">
        <div class="news-meta"><span class="discovery-pill ${escapeHtml(d.severity || "low")}">${escapeHtml(d.severity || "low").toUpperCase()}</span><span>${escapeHtml(d.type || "signal")}</span></div>
        <div class="discovery-title">${escapeHtml(d.title || "Discovery")}</div>
        <div class="discovery-desc">${escapeHtml(d.description || "")}</div>
      </div>`).join("");
  } catch (e) { console.error("[ERROR] DISCOVERY QUEUE FAILURE:", e); }
}

async function loadProviderSettings() {
  try {
    const res = await fetchJSON("/api/provider-settings");
    const el = document.getElementById("provider-settings");
    if (!el) return;
    el.innerHTML = (res.providers || []).map(p => `
      <div class="provider-row ${escapeHtml(p.status || "unknown")}">
        <div class="provider-head"><span>${escapeHtml(p.label)}</span><span class="provider-pill">${escapeHtml(p.status || "unknown")}</span></div>
        <div class="provider-meta">${escapeHtml(p.active_source || "unknown")} // every ${p.refresh_interval_minutes || "?"}m // fallback ${p.fallback_allowed ? "allowed" : "off"}</div>
      </div>`).join("");
  } catch (e) { console.error("[ERROR] PROVIDER SETTINGS FAILURE:", e); }
}

async function loadAuditTrail() {
  try {
    const res = await fetchJSON("/api/audit");
    const el = document.getElementById("audit-trail");
    if (!el) return;
    el.innerHTML = (res.entries || []).slice(0, 10).map(a => `
      <div class="audit-row">
        <div><span class="audit-time">${formatDate(a.time)}</span> <span>${escapeHtml(a.actor || "system")}</span></div>
        <div class="audit-action">${escapeHtml(a.action || "Action")}</div>
        <div class="audit-detail">${escapeHtml(a.detail || "")}</div>
      </div>`).join("");
  } catch (e) { console.error("[ERROR] AUDIT TRAIL FAILURE:", e); }
}

function openSitrep() { window.open("/api/sitrep.md", "_blank"); }
window.openSitrep = openSitrep;

async function copySitrep() {
  const btn = document.getElementById("copy-sitrep-btn");
  try {
    const text = await fetch("/api/sitrep.md").then(r => r.text());
    await navigator.clipboard.writeText(text);
    if (btn) {
      const original = btn.textContent;
      btn.textContent = "[ ✓ COPIED ]";
      btn.classList.add("copy-success");
      setTimeout(() => { btn.textContent = original; btn.classList.remove("copy-success"); }, 1800);
    }
  } catch (e) {
    console.error("[ERROR] COPY SITREP FAILURE:", e);
    if (btn) btn.textContent = "[ COPY FAILED ]";
  }
}
window.copySitrep = copySitrep;

async function refreshAll() {
  console.log('%c> REFRESHING OSINT FEEDS...', 'color: #008f11;');
  loadContextLayers();
  await Promise.allSettled([
    loadFlights(), loadShips(), loadNews(), loadWeather(), loadEnergy(),
    loadConnectivity(), loadSeismic(), loadMilitaryBases(), loadStrategicAssets(), loadMovements(), loadBriefing(), loadEvents(), loadSignalRadar(), loadWatchMode(), loadDiscoveries(), loadProviderSettings(), loadAuditTrail(),
  ]);
  await loadSources();
  const now = new Date();
  document.getElementById("last-update").textContent = 
    `> LAST UPDATE: ${now.toISOString().replace('T', ' ').slice(0, 19)} UTC`;
  document.getElementById("loading").classList.add("hidden");
  console.log('%c> OSINT UPDATE COMPLETE', 'color: #00ff41;');
}

async function triggerBackendRefresh() {
  try { await fetch("/api/refresh"); } catch {}
}

// Initial load + polling
setTimeout(() => {
  refreshAll();
}, 2000);

setInterval(refreshAll, 60000);
setInterval(triggerBackendRefresh, 5 * 60 * 1000);
