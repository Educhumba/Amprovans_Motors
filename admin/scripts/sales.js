(function() {
// ----------------------------
// SALES MANAGEMENT LOGIC
// ----------------------------

let allCarsForSales = [];
let allAgents = [];
let allSales = [];
let commissionRate = 0.05; // 5% commission for agents

const role = localStorage.getItem("role");
const token = localStorage.getItem("token");

document.addEventListener("DOMContentLoaded", () => {
  loadAvailableCarsForSales();
  if (role === "admin") {
    loadAgents();
  }
  loadSales();
  loadSummary();

  // Show agent select only for admin
  if (role === "admin") document.getElementById("agentSelectGroup").style.display = "block";
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

    if (role === "agent") {
      const myAgentId = localStorage.getItem("userId");

      filteredSales = allSales.filter(s => String(s.agent_id) === String(myAgentId));
    }

    displaySales(filteredSales);

  } catch (err) {
    console.error("Error loading sales:", err);
  }
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

    const soldPrice = Number(s.sold_price || 0);
    const profit = Number(s.profit || 0);

    const agentName = s.Agent && s.Agent.name ? s.Agent.name : "Admin";
    const commission = Number(s.commission || 0);
    const date = s.created_at ? new Date(s.created_at).toLocaleDateString() : "-";

    row.innerHTML = `
      <td>${carName}</td>
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
document.getElementById("filterAgent").addEventListener("change", filterSales);
document.getElementById("filterStartDate").addEventListener("change", filterSales);
document.getElementById("filterEndDate").addEventListener("change", filterSales);
document.getElementById("resetSalesFilters").addEventListener("click", () => {
  document.getElementById("filterAgent").value = "";
  document.getElementById("filterStartDate").value = "";
  document.getElementById("filterEndDate").value = "";
  loadSales();
});

function filterSales() {
  if (role === "agent") {
    // Agents should NEVER filter others
    return;
  }

  const agentId = document.getElementById("filterAgent").value;
  const startDate = document.getElementById("filterStartDate").value;
  const endDate = document.getElementById("filterEndDate").value;

  let filtered = allSales;

  if (agentId) {
    filtered = filtered.filter(s => s.agent_id == agentId);
  }

  if (startDate) {
    filtered = filtered.filter(s => new Date(s.created_at) >= new Date(startDate));
  }

  if (endDate) {
    filtered = filtered.filter(s => new Date(s.created_at) <= new Date(endDate));
  }

  displaySales(filtered);
}

// ----------------------------
// Export PDF
// ----------------------------
// Enable/disable date inputs based on report type
document.getElementById("reportType").addEventListener("change", e => {
  const type = e.target.value;
  const startInput = document.getElementById("filterStartDate");
  const endInput = document.getElementById("filterEndDate");

  if (type === "custom") {
    startInput.disabled = false;
    endInput.disabled = false;
  } else {
    startInput.disabled = true;
    endInput.disabled = true;
    startInput.value = "";
    endInput.value = "";
  }
});

// ----------------------------
// Export PDF using backend
// ----------------------------
document.getElementById("exportSalesPDF").addEventListener("click", async () => {
  const reportType = document.getElementById("reportType").value;
  const startDate = document.getElementById("filterStartDate").value;
  const endDate = document.getElementById("filterEndDate").value;
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

document.getElementById("exportDetailedSalesPDF").addEventListener("click", async () => {
  const startDate = document.getElementById("filterStartDate").value;
  const endDate = document.getElementById("filterEndDate").value;
  const agentId = document.getElementById("filterAgent").value;

  // Optional: validate date inputs
  if ((startDate && !endDate) || (!startDate && endDate)) {
    return alert("Please select both start and end dates for the report");
  }

  // Construct query string
  let query = [];
  if (startDate) query.push(`start_date=${startDate}`);
  if (endDate) query.push(`end_date=${endDate}`);
  if (agentId) query.push(`agent_id=${agentId}`);

  const url = `http://localhost:5000/api/sales/report/detailed?${query.join("&")}`;

  try {
    const token = localStorage.getItem("token"); // make sure you have the JWT stored
    if (!token) return alert("You must be logged in to download reports");

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!res.ok) {
      if (res.status === 403) alert("You are not authorized to generate this report");
      else if (res.status === 404) alert("No sales found for the selected period");
      else throw new Error("Failed to generate report");
      return;
    }

    const blob = await res.blob();
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `detailed-sales-report-${Date.now()}.pdf`;
    link.click();

  } catch (err) {
    console.error(err);
    alert("Error generating detailed PDF report");
  }
});
})();