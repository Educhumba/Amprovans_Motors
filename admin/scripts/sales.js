(function() {
// ----------------------------
// SALES MANAGEMENT LOGIC
// ----------------------------

let allCarsForSales = [];
let allAgents = [];
let allSales = [];

const role = localStorage.getItem("role");
const token = localStorage.getItem("token");

document.addEventListener("DOMContentLoaded", () => {
  loadAvailableCarsForSales();
  if (role === "admin") {
    loadAgents();
  }
  if (role === "admin") {
    loadAgentRanking();
  }
  loadSales();
  loadSummary();

  // Show agent select only for admin
  if (role === "admin") document.getElementById("agentSelectGroup").style.display = "block";

  const reportTypeEl = document.getElementById("reportType");
  const startInput = document.getElementById("salesStartDate");
  const endInput = document.getElementById("salesEndDate");

  if (!reportTypeEl || !startInput || !endInput) {
    console.error("Report elements missing");
    return;
  }

reportTypeEl.addEventListener("change", () => {

  const startInput = document.getElementById("salesStartDate");
  const endInput = document.getElementById("salesEndDate");

  if (reportTypeEl.value === "custom") {
    startInput.disabled = false;
    endInput.disabled = false;

    setDateLimits();
  } else {
    startInput.disabled = true;
    endInput.disabled = true;

    startInput.value = "";
    endInput.value = "";
  }
});
document.getElementById("filterAgent").addEventListener("change", filterSales);
document.getElementById("salesStartDate").addEventListener("change", () => {
  validateDateRange();
  filterSales();
});
document.getElementById("salesEndDate").addEventListener("change", () => {
  validateDateRange();
  filterSales();
});
const ownershipEl = document.getElementById("salesFilterOwnership");

if (ownershipEl) {
  ownershipEl.addEventListener("change", () => {
    filterSales();
  });
}
reportTypeEl.dispatchEvent(new Event("change"));
function setDateLimits() {
  const startInput = document.getElementById("salesStartDate");
  const endInput = document.getElementById("salesEndDate");

  const today = new Date().toISOString().split("T")[0];
  const minDate = "2026-01-01";

  startInput.min = minDate;
  startInput.max = today;

  endInput.min = minDate;
  endInput.max = today;
}
function validateDateRange() {
  const startInput = document.getElementById("salesStartDate");
  const endInput = document.getElementById("salesEndDate");

  const minDate = new Date("2026-01-01");
  const today = new Date();

  const start = new Date(startInput.value);
  const end = new Date(endInput.value);

  if (startInput.value && start < minDate) {
    alert("Start date cannot be before 2026");
    startInput.value = "";
  }

  if (endInput.value && end > today) {
    alert("End date cannot be in the future");
    endInput.value = "";
  }

  if (startInput.value && endInput.value && start > end) {
    alert("Start date cannot be after end date");
    startInput.value = "";
    endInput.value = "";
  }
}
});

function enforceDateLimits(input) {
  const min = new Date("2026-01-01");
  const max = new Date();

  const val = new Date(input.value);

  if (!input.value) return;

  if (val < min) {
    input.value = "";
    input.setCustomValidity("Invalid date range");
    input.reportValidity();
  }

  if (val > max) {
    input.value = "";
    input.setCustomValidity("Invalid date range");
    input.reportValidity();
  }
}

document.getElementById("salesStartDate").addEventListener("input", (e) => {
  enforceDateLimits(e.target);
});

document.getElementById("salesEndDate").addEventListener("input", (e) => {
  enforceDateLimits(e.target);
});

// ----------------------------
// Load Cars
// ----------------------------
async function loadAvailableCarsForSales() {
  const selectCar = document.getElementById("selectCar");
  if (!selectCar) return console.warn("Sales car select not found");

  try {
    const res = await fetch("http://localhost:5000/api/cars", { headers: { Authorization: `Bearer ${token}` } });
    const cars = await res.json();

    allCarsForSales = cars.filter(c => c.status === "available"); // only available

    selectCar.innerHTML = `<option value="">-- Select Car --</option>`;
    allCarsForSales.forEach(car => {
      const option = document.createElement("option");
      option.value = car.id;
      option.textContent = `${car.make} ${car.model} (${car.year}) - KSh ${Number(car.price).toLocaleString()}`;
      selectCar.appendChild(option);
    });
  } catch (err) {
    console.error("Failed to load cars for sales:", err);
    selectCar.innerHTML = `<option value="">Failed to load cars</option>`;
  }
}

// ----------------------------
// Load Agents
// ----------------------------
async function loadAgents() {
  try {
    const res = await fetch("http://localhost:5000/api/agents", { headers: { Authorization: `Bearer ${token}` } });
    allAgents = await res.json();

    const selectAgent = document.getElementById("selectAgent");
    const filterAgent = document.getElementById("filterAgent");

    selectAgent.innerHTML = `<option value="">-- Select Agent --</option>`;
    filterAgent.innerHTML = `<option value="">All Agents</option>`;

    allAgents.forEach(agent => {
      const option = document.createElement("option");
      option.value = agent.id;
      option.textContent = agent.name;
      selectAgent.appendChild(option);

      const option2 = document.createElement("option");
      option2.value = agent.id;
      option2.textContent = agent.name;
      filterAgent.appendChild(option2);
    });
  } catch (err) {
    console.error("Error loading agents:", err);
  }
}

// ----------------------------
// Load Sales
// ----------------------------
async function loadSales() {
  try {
    const res = await fetch("http://localhost:5000/api/sales", {
      headers: { Authorization: `Bearer ${token}` }
    });

    allSales = await res.json();

    let filteredSales = allSales;

    displaySales(filteredSales);

  } catch (err) {
    console.error("Error loading sales:", err);
  }
}

function updateReportPreview() {
  const type = document.getElementById("reportType").value;
  const ownership = document.getElementById("salesFilterOwnership").value;
  const agent = document.getElementById("filterAgent");

  let text = "Showing: ";

  if (type) text += `${type} report`;
  if (ownership) text += ` | ${ownership} cars`;

  if (agent && agent.value) {
    const name = agent.options[agent.selectedIndex]?.text || "";
    text += ` | Agent: ${name}`;
  }

  const preview = document.getElementById("reportPreview");
  if (preview) preview.textContent = text;
}

// ----------------------------
// Display Sales Table
// ----------------------------
function displaySales(sales) {
  const tbody = document.getElementById("salesTableBody");
  tbody.innerHTML = "";

  sales.forEach(s => {
    const row = document.createElement("tr");

    const car = s.Car || {};
    const carName = `${car.make || "N/A"} ${car.model || ""} (${car.year || ""})`;
    const ownership = car.ownership || "N/A";
    const soldPrice = Number(s.sold_price || 0);
    const profit = Number(s.profit || 0);

    const agentName = s.Agent && s.Agent.name ? s.Agent.name : "Admin";
    const commission = Number(s.commission || 0);
    const date = s.created_at ? new Date(s.created_at).toLocaleDateString() : "-";

    row.innerHTML = `
      <td>${carName}</td>
      <td>${ownership}</td>
      <td>KSh ${soldPrice.toLocaleString()}</td>
      <td>KSh ${profit.toLocaleString()}</td>
      <td>${agentName}</td>
      <td>KSh ${commission.toLocaleString()}</td>
      <td>${date}</td>
    `;

    tbody.appendChild(row);
  });
}

// ----------------------------
// Update stats
// ----------------------------
async function loadSummary() {
  const res = await fetch("http://localhost:5000/api/sales/summary", {
    headers: { Authorization: `Bearer ${token}` }
  });

  const data = await res.json();

  if (role === "admin") {
    document.getElementById("totalSales").textContent = data.totalSales.toLocaleString();
    document.getElementById("grossProfit").textContent = data.totalProfit.toLocaleString();
    document.getElementById("totalCommission").textContent = data.totalCommission.toLocaleString();
    document.getElementById("netProfit").textContent = data.netProfit.toLocaleString();
  } else {
    document.getElementById("mySales").textContent = data.totalSales.toLocaleString();
    document.getElementById("myProfit").textContent = data.totalProfit.toLocaleString();
    document.getElementById("myCommission").textContent = data.totalCommission.toLocaleString();
  }
}

// ----------------------------
// Submit Sale Form
// ----------------------------
const saleForm = document.getElementById("saleForm");
saleForm.addEventListener("submit", async e => {
  e.preventDefault();

  const carId = document.getElementById("selectCar").value;
  const price = parseFloat(document.getElementById("salePrice").value);
  let agentId = null;

  if (role === "agent") {
    agentId = localStorage.getItem("userId");

  } else if (role === "admin") {
    const selectedAgent = document.getElementById("selectAgent").value;
    agentId = selectedAgent
  }

  if (!carId || !price) return alert("Select car and enter price");

  const car = allCarsForSales.find(c => c.id == carId);
  if (!car) return alert("Car not found");
  if (price < car.cost) return alert("Sold price cannot be less than cost");

  try {
    const res = await fetch("http://localhost:5000/api/sales", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ car_id: carId, sold_price: price, agent_id: agentId })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to record sale");

    alert("Sale recorded successfully!");
    loadAvailableCarsForSales();
    loadSales();
    loadSummary();
    saleForm.reset();
  } catch (err) {
    console.error(err);
    alert("Error recording sale");
  }
});

// ----------------------------
// Filter Sales
// ----------------------------
document.getElementById("resetSalesFilters").addEventListener("click", () => {

  const agent = document.getElementById("filterAgent");
  const ownership = document.getElementById("salesFilterOwnership");
  const reportType = document.getElementById("reportType");
  const detailType = document.getElementById("reportDetailType");
  const start = document.getElementById("salesStartDate");
  const end = document.getElementById("salesEndDate");

  if (agent) agent.value = "";
  if (ownership) {ownership.value = "";ownership.dispatchEvent(new Event("change"));}
  if (reportType) reportType.value = "";
  if (detailType) detailType.value = "";

  if (start) {
    start.value = "";
    start.disabled = true;
  }

  if (end) {
    end.value = "";
    end.disabled = true;
  }

  filterSales();
  loadSales();
  loadSummary();

});

function filterSales() {
  let filtered = allSales;

if (role === "agent") {
  // Only filter their own sales
  filtered = filtered.filter(s => s.agent_id == localStorage.getItem("userId"));
}

  const agentId = document.getElementById("filterAgent").value;
  const startDate = document.getElementById("salesStartDate").value;
  const endDate = document.getElementById("salesEndDate").value;
  const ownership = document.getElementById("salesFilterOwnership").value;

  if (agentId) {
    filtered = filtered.filter(s => s.agent_id == agentId);
  }

  if (ownership) {
  filtered = filtered.filter(
    s => (s.Car?.ownership || "").toLowerCase() === ownership.toLowerCase()
  );
}

  if (startDate) {
    filtered = filtered.filter(s => new Date(s.created_at) >= new Date(startDate));
  }

  if (endDate) {
    filtered = filtered.filter(s => new Date(s.created_at) <= new Date(endDate));
  }

  displaySales(filtered);
  updateStatsFromFilteredData(filtered);
  updateReportPreview();
}

function updateStatsFromFilteredData(filtered) {
  let totalSales = 0;
  let totalProfit = 0;
  let totalCommission = 0;

  filtered.forEach(s => {
    totalSales += Number(s.sold_price || 0);
    totalProfit += Number(s.profit || 0);
    totalCommission += Number(s.commission || 0);
  });

  if (role === "admin") {
    document.getElementById("totalSales").textContent = totalSales.toLocaleString();
    document.getElementById("grossProfit").textContent = totalProfit.toLocaleString();
    document.getElementById("totalCommission").textContent = totalCommission.toLocaleString();
    document.getElementById("netProfit").textContent = (totalProfit - totalCommission).toLocaleString();
  } else {
    document.getElementById("mySales").textContent = totalSales.toLocaleString();
    document.getElementById("myProfit").textContent = totalProfit.toLocaleString();
    document.getElementById("myCommission").textContent = totalCommission.toLocaleString();
  }
}

// ----------------------------
// Export PDF
// ----------------------------
// Enable/disable date inputs based on report type

async function loadAgentRanking() {
  const res = await fetch("http://localhost:5000/api/sales/ranking", {
    headers: { Authorization: `Bearer ${token}` }
  });

  const data = await res.json();
  const list = document.getElementById("agentRankingList");
  list.innerHTML = "";

  data.sort((a, b) => b.totalProfit - a.totalProfit);
  data.forEach((a, index) => {
    const li = document.createElement("li");
    const name = a.Agent?.name || "Unknown Agent";
    li.textContent = `${index + 1}. ${name} - KSh ${Number(a.totalProfit).toLocaleString()}`;
    list.appendChild(li);
  });
}
// ----------------------------
// Export PDF using backend
// ----------------------------
document.getElementById("exportSalesPDF").addEventListener("click", async () => {
  const reportType = document.getElementById("reportType").value;
  const startDate = document.getElementById("salesStartDate").value;
  const endDate = document.getElementById("salesEndDate").value;
  const agentId = document.getElementById("filterAgent").value;

  if (!reportType) return alert("Select a report type");

  const today = new Date();
  const minDate = new Date("2024-01-01");

  if (reportType === "custom") {
    if (!startDate || !endDate) {
      return alert("Select start and end dates");
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > today || end > today) {
      return alert("Dates cannot be in the future");
    }

    if (start < minDate || end < minDate) {
      return alert("Dates cannot be earlier than 2024");
    }

    if (start > end) {
      return alert("Start date cannot be after end date");
    }
  }

  let query = [];
  if (role === "agent") {
    const myAgentId = localStorage.getItem("userId");
    query.push(`agent_id=${myAgentId}`);
  }
  if (reportType === "custom") {
    if (!startDate || !endDate) return alert("Select start and end dates for custom report");
    query.push(`start_date=${startDate}`);
    query.push(`end_date=${endDate}`);
  } else if (reportType === "weekly") {
    const today = new Date();
    const lastWeek = new Date(today);
    lastWeek.setDate(today.getDate() - 7);
    query.push(`start_date=${lastWeek.toISOString().split('T')[0]}`);
    query.push(`end_date=${today.toISOString().split('T')[0]}`);
  } else if (reportType === "monthly") {
    const today = new Date();
    const lastMonth = new Date(today);
    lastMonth.setMonth(today.getMonth() - 1);
    query.push(`start_date=${lastMonth.toISOString().split('T')[0]}`);
    query.push(`end_date=${today.toISOString().split('T')[0]}`);
  }

const detailType = document.getElementById("reportDetailType").value;
if (detailType) query.push(`detail=${detailType}`);

  if (agentId) query.push(`agent_id=${agentId}`);

  const url = `http://localhost:5000/api/sales/report/pdf?${query.join('&')}`;

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error("Failed to generate report");

    const blob = await res.blob();
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `sales-report-${Date.now()}.pdf`;
    link.click();
  } catch (err) {
    console.error(err);
    alert("Error generating PDF report");
  }
});
})();