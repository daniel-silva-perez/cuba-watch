// [CLASSIFIED] CUBA WATCH — INTELLIGENCE TERMINAL
// CLEARANCE LEVEL 5 REQUIRED

console.log('%c[TOP SECRET] CUBA WATCH INTELLIGENCE SYSTEM', 'color: #00ff41; font-size: 16px; font-weight: bold;');
console.log('%c> Initializing secure connection...', 'color: #008f11;');
console.log('%c> Authentication: BIOMETRIC VERIFIED', 'color: #00ff41;');
console.log('%c> Access Level: 5 [MAXIMUM]', 'color: #ff3333; font-weight: bold;');

// Generate random session ID
const sessionId = 'NRO-' + Math.floor(10000 + Math.random() * 90000) + '-CUBA';
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
  zoomControl: true,
  attributionControl: false,
});

map.on('mousemove', updateCoords);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 18,
}).addTo(map);

// Cuba outline highlight - tactical style
const cubaBounds = L.latLngBounds([[19.8, -85.0], [23.3, -74.0]]);
L.rectangle(cubaBounds, { 
  color: "#00ff41", 
  weight: 1, 
  fill: false, 
  dashArray: "4,4",
  opacity: 0.5
}).addTo(map);

const flightLayer = L.layerGroup().addTo(map);
const shipLayer = L.layerGroup().addTo(map);
const basesLayer = L.layerGroup().addTo(map);
const movementsLayer = L.layerGroup().addTo(map);
const assetsLayer = L.layerGroup().addTo(map);

const layerGroups = {
  flights: flightLayer,
  ships: shipLayer,
  bases: basesLayer,
  movements: movementsLayer,
  assets: assetsLayer,
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

// Terminal-style icons
const planeIcon = L.divIcon({
  className: "plane-icon",
  html: '<div style="color:#00ffff; font-size:14px; text-shadow:0 0 6px #00ffff;">▲</div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});
const shipIcon = L.divIcon({
  className: "ship-icon",
  html: '<div style="color:#00ff41; font-size:12px; text-shadow:0 0 6px #00ff41;">◆</div>',
  iconSize: [12, 12],
  iconAnchor: [6, 6],
});

const baseIconCuba = glyphIcon('<span style="color:#ff3333; font-size:16px; text-shadow:0 0 6px #ff3333;">■</span>');
const baseIconUS   = glyphIcon('<span style="color:#00ffff; font-size:16px; text-shadow:0 0 6px #00ffff;">■</span>');
const movementIcon = glyphIcon('<span style="color:#ffb000; font-size:14px; text-shadow:0 0 6px #ffb000;">●</span>');

const assetIcons = {
  power_plant: glyphIcon('<span style="color:#ffff00; font-size:14px; text-shadow:0 0 6px #ffff00;">⚡</span>'),
  refinery:    glyphIcon('<span style="color:#ff6600; font-size:14px; text-shadow:0 0 6px #ff6600;">▣</span>'),
  oil_field:   glyphIcon('<span style="color:#ff6600; font-size:14px; text-shadow:0 0 6px #ff6600;">▣</span>'),
  mining:      glyphIcon('<span style="color:#888888; font-size:14px; text-shadow:0 0 6px #888888;">▪</span>'),
  port:        glyphIcon('<span style="color:#00ffff; font-size:14px; text-shadow:0 0 6px #00ffff;">⚓</span>'),
  sigint:      glyphIcon('<span style="color:#ff00ff; font-size:14px; text-shadow:0 0 6px #ff00ff;">◉</span>'),
};
const assetIconDefault = glyphIcon('<span style="color:#00ff41; font-size:14px; text-shadow:0 0 6px #00ff41;">★</span>');

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  return res.json();
}

function setStale(elId, stale) {
  const el = document.getElementById(elId);
  if (el) el.classList.toggle("visible", !!stale);
}

function setDot(elId, color) {
  const el = document.getElementById(elId);
  if (!el) return;
  el.className = "dot " + color;
}

async function loadFlights() {
  try {
    const res = await fetchJSON("/api/flights");
    flightLayer.clearLayers();
    (res.data || []).forEach(f => {
      if (f.lat == null || f.lon == null) return;
      const m = L.marker([f.lat, f.lon], { icon: planeIcon });
      m.bindPopup(
        `<div class="flight-popup">
          <strong>> ${f.callsign || f.icao}</strong>
          <div class="row"><span>ICAO</span><span>${f.icao}</span></div>
          <div class="row"><span>ALTITUDE</span><span>${f.altitude || "—"} FT</span></div>
          <div class="row"><span>SPEED</span><span>${f.speed || "—"} KT</span></div>
          <div class="row"><span>HEADING</span><span>${f.heading || "—"}°</span></div>
          <div class="row"><span>TYPE</span><span>${f.aircraft_type || "—"}</span></div>
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
      const m = L.marker([s.lat, s.lon], { icon: shipIcon });
      m.bindPopup(
        `<div class="ship-popup">
          <strong>> ${s.name || "UNKNOWN VESSEL"}</strong>
          <div class="row"><span>MMSI</span><span>${s.mmsi}</span></div>
          <div class="row"><span>SPEED</span><span>${s.speed != null ? s.speed + " KN" : "—"}</span></div>
          <div class="row"><span>HEADING</span><span>${s.heading != null ? s.heading + "°" : "—"}</span></div>
          <div class="row"><span>TYPE</span><span>${s.ship_type || "—"}</span></div>
          <div class="row"><span>FLAG</span><span>${s.flag || "—"}</span></div>
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

async function loadNews() {
  try {
    const res = await fetchJSON("/api/news");
    const container = document.getElementById("news-list");
    container.innerHTML = "";
    if (!res.data || res.data.length === 0) {
      container.innerHTML = '<div class="loading-text">> NO INTERCEPTS DETECTED</div>';
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
    console.error("[ERROR] SIGINT FEED FAILURE:", e);
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
  return s.replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;","'":"&quot;","'":"&#39;"}[c]));
}

async function loadMilitaryBases() {
  try {
    const res = await fetchJSON("/api/military/bases");
    basesLayer.clearLayers();
    (res.data || []).forEach(b => {
      if (b.lat == null || b.lon == null) return;
      const icon = b.country === "US" ? baseIconUS : baseIconCuba;
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
    console.error("[ERROR] TROOP MOVEMENTS FEED FAILURE:", e);
    setDot("dot-military", "red");
  }
}

async function refreshAll() {
  console.log('%c> REFRESHING INTELLIGENCE FEEDS...', 'color: #008f11;');
  await Promise.allSettled([
    loadFlights(), loadShips(), loadNews(), loadWeather(), loadEnergy(),
    loadMilitaryBases(), loadStrategicAssets(), loadMovements(),
  ]);
  const now = new Date();
  document.getElementById("last-update").textContent = 
    `> LAST UPDATE: ${now.toISOString().replace('T', ' ').slice(0, 19)} UTC`;
  document.getElementById("loading").classList.add("hidden");
  console.log('%c> INTELLIGENCE UPDATE COMPLETE', 'color: #00ff41;');
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
