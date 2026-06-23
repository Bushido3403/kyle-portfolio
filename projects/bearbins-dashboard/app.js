const API_BASE = "https://api.bearbins.nodifyr.io";

let offset = 0;
const limit = 100;

const rowsEl = document.getElementById("rows");
const statusEl = document.getElementById("status");
const macInput = document.getElementById("mac");

function status(msg) {
  statusEl.textContent = msg;
}

function esc(s) {
  return String(s).replace(/[&<>]/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;"
  }[c]));
}

function renderRow(r) {
  const sw = r.switch_state ? "ON" : "OFF";
  const beacon =
    r.beacon_lat != null
      ? `${r.beacon_lat.toFixed(6)}, ${r.beacon_lng.toFixed(6)}`
      : "";

  return `
    <tr>
      <td class="mono">${esc(r.received_at_server)}</td>
      <td class="mono">${esc(r.mac)}</td>
      <td>${r.rssi_dbm}</td>
      <td class="mono">${r.counter}</td>
      <td><span class="badge">${sw}</span></td>
      <td class="mono">${esc(r.payload_hex)}</td>
      <td>${esc(beacon)} ${esc(r.beacon_label || "")}</td>
    </tr>
  `;
}

async function load({ reset = false } = {}) {
  if (reset) {
    offset = 0;
    rowsEl.innerHTML = "";
  }

  const params = new URLSearchParams({
    limit,
    offset
  });

  if (macInput.value.trim()) {
    params.set("mac", macInput.value.trim().toUpperCase());
  }

  status("Loading…");

  const res = await fetch(`${API_BASE}/api/v1/ble/packets?${params}`);
  if (!res.ok) {
    status(`Error ${res.status}`);
    return;
  }

  const data = await res.json();
  data.rows.forEach(r => {
    rowsEl.insertAdjacentHTML("beforeend", renderRow(r));
  });

  if (data.next_offset != null) {
    offset = data.next_offset;
    status(`Loaded ${data.rows.length}`);
  } else {
    status("End of results");
  }
}

document.getElementById("refresh").onclick = () => load({ reset: true });
document.getElementById("more").onclick = () => load();

load({ reset: true });
