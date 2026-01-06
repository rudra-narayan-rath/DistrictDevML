// ================= CONFIGURATION =================
const CSV_PATH = "regional_data_10_indian_districts.csv";

let rawRows = [];       // all parsed rows from CSV
let filteredRows = []; // rows after filters
let sortState = { key: null, direction: "asc" };

// ================= CSV PARSER =================
// Simple CSV parser (no quoted comma support – OK for this dataset)
function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter(line => line.trim() !== "");
  if (!lines.length) return [];

  const headers = lines[0].split(",").map(h => h.trim());
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",");
    const row = {};
    headers.forEach((header, idx) => {
      row[header] = (values[idx] ?? "").trim();
    });
    rows.push(row);
  }
  return rows;
}

// ================= HELPERS =================
function uniqueByKey(rows, key) {
  return [...new Set(rows.map(r => r[key]).filter(Boolean))];
}

// ================= STATS =================
function updateStats(rows) {
  const districts = uniqueByKey(rows, "region");
  const sectors = uniqueByKey(rows, "sector");

  document.getElementById("stat-districts").textContent = districts.length || "—";
  document.getElementById("stat-records").textContent = rows.length || "—";
  document.getElementById("stat-sectors").textContent = sectors.length || "—";

  const indicatorsPerDistrict =
    districts.length ? Math.round((rows.length / districts.length) * 10) / 10 : "—";

  document.getElementById("stat-indicators-per-district").textContent =
    indicatorsPerDistrict;
}

// ================= FILTERS =================
function populateDistrictFilter(rows) {
  const select = document.getElementById("filter-district");
  const districts = uniqueByKey(rows, "region").sort();

  districts.forEach(district => {
    const option = document.createElement("option");
    option.value = district;
    option.textContent = district;
    select.appendChild(option);
  });
}

function applyFilters() {
  const district = document.getElementById("filter-district").value.trim();
  const sector = document.getElementById("filter-sector").value.trim();
  const indicatorQuery = document
    .getElementById("filter-indicator")
    .value.trim()
    .toLowerCase();

  filteredRows = rawRows.filter(row => {
    const matchDistrict = district ? row.region === district : true;
    const matchSector = sector ? row.sector === sector : true;
    const matchIndicator = indicatorQuery
      ? row.indicator.toLowerCase().includes(indicatorQuery)
      : true;

    return matchDistrict && matchSector && matchIndicator;
  });

  sortState.key
    ? sortRows(sortState.key, sortState.direction)
    : renderTableBody(filteredRows);
}

// ================= TABLE =================
function renderTableBody(rows) {
  const tbody = document.getElementById("dataset-tbody");
  tbody.innerHTML = "";

  if (!rows.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" class="cell-empty">
          No records match the current filters.
        </td>
      </tr>`;
    return;
  }

  rows.forEach(row => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${row.region || "—"}</td>
      <td>${row.sector || "—"}</td>
      <td>${row.indicator || "—"}</td>
      <td class="numeric">${row.value || "—"}</td>
    `;

    tbody.appendChild(tr);
  });
}

// ================= SORTING =================
function sortRows(key, direction) {
  sortState = { key, direction };
  const isNumeric = key === "value";

  filteredRows.sort((a, b) => {
    let av = a[key] ?? "";
    let bv = b[key] ?? "";

    if (isNumeric) {
      const an = parseFloat(av);
      const bn = parseFloat(bv);
      if (isNaN(an)) return 1;
      if (isNaN(bn)) return -1;
      return direction === "asc" ? an - bn : bn - an;
    }

    return direction === "asc"
      ? av.localeCompare(bv)
      : bv.localeCompare(av);
  });

  renderTableBody(filteredRows);
  updateSortIndicators(key, direction);
}

function updateSortIndicators(key, direction) {
  document.querySelectorAll("#dataset-table thead th").forEach(th => {
    th.classList.remove("sort-asc", "sort-desc");
    if (th.dataset.key === key) {
      th.classList.add(direction === "asc" ? "sort-asc" : "sort-desc");
    }
  });
}

// ================= EVENT SETUP =================
function setupSorting() {
  document.querySelectorAll("#dataset-table thead th").forEach(th => {
    th.addEventListener("click", () => {
      const key = th.dataset.key;
      if (!key) return;
      const direction =
        sortState.key === key && sortState.direction === "asc"
          ? "desc"
          : "asc";
      sortRows(key, direction);
    });
  });
}

function setupFilters() {
  document.getElementById("filter-district").addEventListener("change", applyFilters);
  document.getElementById("filter-sector").addEventListener("change", applyFilters);
  document.getElementById("filter-indicator").addEventListener("input", applyFilters);
}

// ================= INIT =================
async function loadCsvAndInit() {
  const statusEl = document.getElementById("status-message");
  statusEl.textContent = "Loading dataset…";

  try {
    const response = await fetch(CSV_PATH);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const text = await response.text();
    rawRows = parseCsv(text);
    filteredRows = [...rawRows];

    updateStats(rawRows);
    populateDistrictFilter(rawRows);
    renderTableBody(filteredRows);

    statusEl.textContent = `Loaded ${rawRows.length} records successfully.`;
  } catch (err) {
    console.error(err);
    statusEl.textContent =
      "Error: Dataset could not be loaded. Please check the file path.";
  }
}

// ================= DOM READY =================
document.addEventListener("DOMContentLoaded", () => {
  setupSorting();
  setupFilters();
  loadCsvAndInit();
});
