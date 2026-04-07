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
  loadAgents();
  loadSales();

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
    const res = await fetch("http://localhost:5000/api/sales", { headers: { Authorization: `Bearer ${token}` } });
    allSales = await res.json();

    // Filter for agent if role is agent
    let filteredSales = allSales;
    if (role === "agent") {
      const myAgentId = localStorage.getItem("userId");
      filteredSales = allSales.filter(s => s.agentId == myAgentId);
    }

    displaySales(filteredSales);
    updateStats(filteredSales);
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
    const profit = s.price - s.cost;
    row.innerHTML = `
      <td>${s.carMake} ${s.carModel} (${s.carYear})</td>
      <td>${Number(s.price).toLocaleString()}</td>
      <td>${Number(profit).toLocaleString()}</td>
      <td>${s.agentName || "-"}</td>
      <td>${new Date(s.date).toLocaleDateString()}</td>
    `;
    tbody.appendChild(row);
  });
}

// ----------------------------
// Update Sales Stats
// ----------------------------
function updateStats(sales) {
  let totalSales = sales.length;
  let grossProfit = sales.reduce((sum, s) => sum + (s.price - s.cost), 0);
  let totalCommission = sales.reduce((sum, s) => sum + ((s.agentId ? s.price * commissionRate : 0)), 0);
  let netProfit = grossProfit - totalCommission;

  document.getElementById("totalSales").textContent = totalSales;
  document.getElementById("grossProfit").textContent = grossProfit.toLocaleString();
  document.getElementById("totalCommission").textContent = totalCommission.toLocaleString();
  document.getElementById("netProfit").textContent = netProfit.toLocaleString();
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
    agentId = selectedAgent !== "" ? selectedAgent : null; // <-- ensures null if no agent selected
  }

  if (!carId || !price) return alert("Select car and enter price");

  const car = allCarsForSales.find(c => c.id == carId);
  if (!car) return alert("Car not found");
  if (price < car.cost) return alert("Sold price cannot be less than cost");

  try {
    const res = await fetch("http://localhost:5000/api/sales", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ car_id: carId, sold_price: price, agent_id: agentId }) // <-- send corrected agentId
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to record sale");

    alert("Sale recorded successfully!");
    loadAvailableCarsForSales();
    loadSales();
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
  displaySales(allSales);
  updateStats(allSales);
});

function filterSales() {
  const agentId = document.getElementById("filterAgent").value;
  const startDate = document.getElementById("filterStartDate").value;
  const endDate = document.getElementById("filterEndDate").value;

  let filtered = allSales;

  if (role === "agent") filtered = filtered.filter(s => s.agentId == localStorage.getItem("userId"));
  if (agentId) filtered = filtered.filter(s => s.agentId == agentId);
  if (startDate) filtered = filtered.filter(s => new Date(s.date) >= new Date(startDate));
  if (endDate) filtered = filtered.filter(s => new Date(s.date) <= new Date(endDate));

  displaySales(filtered);
  updateStats(filtered);
}

// ----------------------------
// Export PDF
// ----------------------------
document.getElementById("exportSalesPDF").addEventListener("click", () => {
  const rows = document.querySelectorAll("#salesTableBody tr");
  if (!rows.length) return alert("No sales to export");

  let content = "Sales Report\n\n";
  rows.forEach(row => content += row.innerText + "\n");
  const blob = new Blob([content], { type: "application/pdf" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "sales-report.pdf";
  link.click();
});
})();