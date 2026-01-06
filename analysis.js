/* ===================== CONFIG ===================== */

// Adjusted path: CSV is in /data relative to web root.
const CSV_PATH = "ranked_interventions_output.csv";

// Fallback sector costs (₹ Crores)
const SECTOR_COSTS = {
  "Water Supply": 30,
  "Healthcare": 40,
  "Road Infrastructure": 60,
  "Education": 50
};

// ✅ District-wise sector costs (₹ Crores)
const DISTRICT_SECTOR_COSTS = {
  "District_Alwar_Rajasthan": {
    "Water Supply": 28,
    "Healthcare": 38,
    "Road Infrastructure": 55,
    "Education": 45
  },
  "District_Gaya_Bihar": {
    "Water Supply": 32,
    "Healthcare": 42,
    "Road Infrastructure": 60,
    "Education": 50
  },
  "District_Koraput_Odisha": {
    "Water Supply": 35,
    "Healthcare": 45,
    "Road Infrastructure": 65,
    "Education": 55
  },
  "District_Nandurbar_Maharashtra": {
    "Water Supply": 30,
    "Healthcare": 40,
    "Road Infrastructure": 58,
    "Education": 48
  },
  "District_Bastar_Chhattisgarh": {
    "Water Supply": 34,
    "Healthcare": 48,
    "Road Infrastructure": 70,
    "Education": 58
  },
  "District_Barmer_Rajasthan": {
    "Water Supply": 31,
    "Healthcare": 41,
    "Road Infrastructure": 59,
    "Education": 49
  },
  "District_Kalahandi_Odisha": {
    "Water Supply": 33,
    "Healthcare": 44,
    "Road Infrastructure": 63,
    "Education": 54
  },
  "District_Palamu_Jharkhand": {
    "Water Supply": 32,
    "Healthcare": 43,
    "Road Infrastructure": 61,
    "Education": 52
  },
  "District_Raichur_Karnataka": {
    "Water Supply": 27,
    "Healthcare": 37,
    "Road Infrastructure": 52,
    "Education": 44
  },
  "District_Dholpur_Rajasthan": {
    "Water Supply": 29,
    "Healthcare": 39,
    "Road Infrastructure": 56,
    "Education": 46
  }
};

// Icons for UI
const SECTOR_ICONS = {
  "Water Supply": "💧",
  "Healthcare": "🏥",
  "Road Infrastructure": "🚧",
  "Education": "🎓"
};

/* ===================== STATE ===================== */

let allData = [];
let currentDistrictData = [];
let selectedDistrict = "";

/* ===================== INIT ===================== */

document.addEventListener("DOMContentLoaded", init);

async function init() {
  await loadCsvData();
  setupEventListeners();
}

/* ===================== CSV LOAD & PARSE ===================== */

async function loadCsvData() {
  try {
    const response = await fetch(CSV_PATH);
    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

    const text = await response.text();
    allData = parseCsv(text);

    if (!allData.length) {
      throw new Error("Parsed CSV is empty. Check headers and rows.");
    }

    populateDistrictSelector();
    showInitialMessage();
  } catch (error) {
    console.error("CSV Load Error:", error);
    const container = document.getElementById("priority-list-container");
    if (container) {
      container.innerHTML = `
        <div class="loading-state error">
          ❌ Failed to load ML analysis data.<br/>
          Please ensure CSV file exists at <code>${CSV_PATH}</code>.
        </div>
      `;
    }
  }
}

/**
 * Robust CSV parser for a CSV with a header line:
 * region,sector,indicator,value,priority_score
 * priority_score is optional; will be randomized if missing.
 */
function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter(line => line.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map(h => h.trim());
  const idxRegion = headers.indexOf("region");
  const idxSector = headers.indexOf("sector");
  const idxIndicator = headers.indexOf("indicator");
  const idxValue = headers.indexOf("value");
  const idxPriority = headers.indexOf("priority_score");

  if (idxRegion === -1 || idxSector === -1 || idxIndicator === -1 || idxValue === -1) {
    console.error("CSV header missing required columns:", headers);
    return [];
  }

  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = line.split(",");
    if (values.length < headers.length) continue;

    const region = values[idxRegion]?.trim();
    const sector = values[idxSector]?.trim();
    const indicator = values[idxIndicator]?.trim();
    const value = parseFloat(values[idxValue]) || 0;
    const priorityScore =
      idxPriority !== -1 ? parseFloat(values[idxPriority]) || 0 : Math.random() * 100;

    if (!region || !sector) continue;

    rows.push({
      region,
      sector,
      indicator,
      value,
      priority_score: priorityScore
    });
  }

  return rows;
}

/* ===================== UI SETUP ===================== */

function populateDistrictSelector() {
  const select = document.getElementById("district-select");
  if (!select) return;

  const districts = [...new Set(allData.map(row => row.region))].sort();

  if (!districts.length) {
    select.innerHTML = `<option value="">No districts found in CSV</option>`;
    return;
  }

  select.innerHTML = `<option value="">Select District</option>`;
  districts.forEach(district => {
    const option = document.createElement("option");
    option.value = district;
    option.textContent = district;
    select.appendChild(option);
  });
}

function setupEventListeners() {
  const districtSelect = document.getElementById("district-select");
  const budgetInput = document.getElementById("budget-input");
  const generateBtn = document.getElementById("generate-btn");

  if (districtSelect) {
    districtSelect.addEventListener("change", e => updatePriorityList(e.target.value));
  }

  if (budgetInput) {
    budgetInput.addEventListener("input", toggleGenerateButton);
  }

  if (generateBtn) {
    generateBtn.addEventListener("click", generateRecommendations);
  }
}

function showInitialMessage() {
  const container = document.getElementById("priority-list-container");
  if (!container) return;

  container.innerHTML = `
    <div class="loading-state">
      📊 Select a district to view ML-based priority ranking
    </div>
  `;
}

/* ===================== HELPERS ===================== */

function getSectorCost(district, sector) {
  return DISTRICT_SECTOR_COSTS[district]?.[sector] ?? SECTOR_COSTS[sector] ?? 0;
}

/* ===================== PRIORITY RANKING ===================== */

function updatePriorityList(district) {
  selectedDistrict = district;

  const container = document.getElementById("priority-list-container");
  if (!container) return;

  if (!district) {
    showInitialMessage();
    return;
  }

  currentDistrictData = allData
    .filter(row => row.region === district)
    .sort((a, b) => b.priority_score - a.priority_score);

  if (!currentDistrictData.length) {
    container.innerHTML = `
      <div class="loading-state error">
        ⚠ No data found for <b>${district}</b> in the CSV.
      </div>
    `;
    return;
  }

  const listItems = currentDistrictData
    .map((item, index) => {
      const cost = getSectorCost(district, item.sector);
      const icon = SECTOR_ICONS[item.sector] || "📌";
      return `
        <div class="priority-item">
          <div class="priority-rank">${index + 1}</div>
          <div class="priority-icon">${icon}</div>
          <div class="priority-content">
            <div class="priority-sector">${item.sector}</div>
            <div class="priority-score">
              Cost: ₹${cost} Cr
            </div>
          </div>
        </div>
      `;
    })
    .join("");

  container.innerHTML = `
    <h3>Priority Ranking for ${district}</h3>
    <div class="priority-list">${listItems}</div>
  `;
}

/* ===================== BUDGET HANDLING ===================== */

function toggleGenerateButton() {
  const budgetInput = document.getElementById("budget-input");
  const generateBtn = document.getElementById("generate-btn");
  if (!budgetInput || !generateBtn) return;

  const budget = parseFloat(budgetInput.value) || 0;
  generateBtn.disabled = budget <= 0;
}

function generateRecommendations() {
  const budgetInput = document.getElementById("budget-input");
  if (!budgetInput) return;

  const budget = parseFloat(budgetInput.value) || 0;

  if (!currentDistrictData.length) {
    alert("Please select a district first.");
    return;
  }

  if (budget <= 0) {
    alert("Please enter a budget greater than 0.");
    return;
  }

  let totalCost = 0;
  const selected = [];

  for (const item of currentDistrictData) {
    const cost = getSectorCost(selectedDistrict, item.sector);
    if (totalCost + cost <= budget) {
      selected.push(item);
      totalCost += cost;
    }
  }

  renderRecommendations(selected, totalCost, budget);
}

/* ===================== FINAL OUTPUT ===================== */

function renderRecommendations(selected, totalCost, budget) {
  const container = document.getElementById("recommendations-container");
  if (!container) return;

  if (selected.length === 0) {
    container.innerHTML = `
      <div class="no-recommendations">
        ❌ No interventions fit within the given budget.
      </div>
    `;
    return;
  }

  const remaining = budget - totalCost;

  const items = selected
    .map(item => {
      const cost = getSectorCost(selectedDistrict, item.sector);
      return `
        <div class="recommendation-item">
          ✔ ${item.sector} — ₹${cost} Cr
        </div>
      `;
    })
    .join("");

  container.innerHTML = `
    <h3>Final Recommended Interventions</h3>
    ${items}
    <div class="budget-summary">
      <p><b>Total Budget:</b> ₹${budget} Cr</p>
      <p><b>Used:</b> ₹${totalCost} Cr</p>
      <p><b>Remaining:</b> ₹${remaining.toFixed(1)} Cr</p>
    </div>
  `;
}
