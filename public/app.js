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

// Tactical theater bounds - expanded to include PR and US bases
const theaterBounds = L.latLngBounds([[17.0, -88.0], [28.0, -68.0]]);
map.fitBounds(theaterBounds);

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

// Tactical SVG Icons
function svgIcon(svgContent, size = 24, color = '#00ff41') {
  return L.divIcon({
    className: 'tactical-icon',
    html: `<div style="width:${size}px;height:${size}px;filter:drop-shadow(0 0 3px ${color});">${svgContent}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2]
  });
}

const planeSvg = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" fill="#00ffff" stroke="#00ffff" stroke-width="0.5"/>
</svg>`;

const fighterSvg = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M22 12l-6-3-3-7-2 7-6 2 6 2 2 7 3-7 6-3z" fill="#00ffff" stroke="#00ffff" stroke-width="0.5"/>
  <path d="M2 12h4" stroke="#00ffff" stroke-width="1.5"/>
</svg>`;

const shipSvg = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M2 21h20v-2l-3-8h-2V7h-3V3H9v4H6v4H4l-3 8v2z" fill="#00ff41" stroke="#00ff41" stroke-width="0.5"/>
  <path d="M9 3v4M15 3v4" stroke="#00ff41" stroke-width="0.5"/>
</svg>`;

const warshipSvg = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M1 20h22v-2l-4-10h-2V6h-3V3h-4v3H7v2H5L1 18v2z" fill="#00ff41" stroke="#00ff41" stroke-width="0.5"/>
  <path d="M7 6h10M9 3v3M15 3v3" stroke="#00ff41" stroke-width="0.5"/>
  <circle cx="12" cy="14" r="2" fill="#000" stroke="#00ff41" stroke-width="0.5"/>
</svg>`;

const baseCubaSvg = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M12 2L2 22h20L12 2z" fill="#ff3333" stroke="#ff3333" stroke-width="0.5"/>
  <text x="12" y="17" text-anchor="middle" fill="#000" font-size="8" font-weight="bold">CU</text>
</svg>`;

const baseUSSvg = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M12 2L2 22h20L12 2z" fill="#00ffff" stroke="#00ffff" stroke-width="0.5"/>
  <text x="12" y="17" text-anchor="middle" fill="#000" font-size="8" font-weight="bold">US</text>
</svg>`;

const baseNATOSvg = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M12 2L2 22h20L12 2z" fill="#ffb000" stroke="#ffb000" stroke-width="0.5"/>
  <text x="12" y="17" text-anchor="middle" fill="#000" font-size="7" font-weight="bold">NATO</text>
</svg>`;

const movementSvg = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="12" cy="12" r="10" fill="none" stroke="#ffb000" stroke-width="2" stroke-dasharray="4 2"/>
  <circle cx="12" cy="12" r="4" fill="#ffb000"/>
  <circle cx="12" cy="12" r="2" fill="#000"/>
</svg>`;

const powerSvg = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="#ffff00" stroke="#ffff00" stroke-width="0.5"/>
</svg>`;

const refinerySvg = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="4" y="10" width="16" height="12" fill="#ff6600" stroke="#ff6600" stroke-width="0.5"/>
  <rect x="7" y="6" width="3" height="4" fill="#ff6600" stroke="#ff6600" stroke-width="0.5"/>
  <rect x="14" y="4" width="3" height="6" fill="#ff6600" stroke="#ff6600" stroke-width="0.5"/>
</svg>`;

const miningSvg = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M4 20h16l-4-8-4 4-4-4-4 8z" fill="#888888" stroke="#888888" stroke-width="0.5"/>
  <path d="M8 12l4-6 4 6" fill="none" stroke="#888888" stroke-width="0.5"/>
</svg>`;

const portSvg = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M12 2C8 2 5 5 5 9c0 3 2 5 4 6v5h6v-5c2-1 4-3 4-6 0-4-3-7-7-7z" fill="#00ffff" stroke="#00ffff" stroke-width="0.5"/>
  <path d="M9 20h6v2H9z" fill="#00ffff"/>
</svg>`;

const sigintSvg = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="none" stroke="#ff00ff" stroke-width="1.5"/>
  <circle cx="12" cy="12" r="3" fill="#ff00ff"/>
  <path d="M12 5v3M12 16v3M5 12h3M16 12h3" stroke="#ff00ff" stroke-width="0.5"/>
</svg>`;

const defaultAssetSvg = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <polygon points="12,2 15,9 22,9 16,14 18,22 12,17 6,22 8,14 2,9 9,9" fill="#00ff41" stroke="#00ff41" stroke-width="0.5"/>
</svg>`;

// Create icon instances
const planeIcon = svgIcon(planeSvg, 20, '#00ffff');
const fighterIcon = svgIcon(fighterSvg, 20, '#00ffff');
const shipIcon = svgIcon(shipSvg, 18, '#00ff41');
const warshipIcon = svgIcon(warshipSvg, 18, '#00ff41');

const baseIconCuba = svgIcon(baseCubaSvg, 24, '#ff3333');
const baseIconUS = svgIcon(baseUSSvg, 24, '#00ffff');
const baseIconNATO = svgIcon(baseNATOSvg, 24, '#ffb000');
const movementIcon = svgIcon(movementSvg, 22, '#ffb000');

const assetIcons = {
  power_plant: svgIcon(powerSvg, 18, '#ffff00'),
  refinery: svgIcon(refinerySvg, 18, '#ff6600'),
  oil_field: svgIcon(refinerySvg, 18, '#ff6600'),
  mining: svgIcon(miningSvg, 18, '#888888'),
  port: svgIcon(portSvg, 18, '#00ffff'),
  sigint: svgIcon(sigintSvg, 18, '#ff00ff'),
};
const assetIconDefault = svgIcon(defaultAssetSvg, 18, '#00ff41');

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
