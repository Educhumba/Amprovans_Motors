// ===============================
// GLOBAL STATE
// ===============================
let allHires = [];
let currentFilter = "all";

// ===============================
// INIT
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  fetchHires();
  setupFilters();
});

// ===============================
// FETCH HIRES
// ===============================
async function fetchHires() {
  try {
    const res = await fetch("http://localhost:5000/api/car-hire/admin");
    const data = await res.json();

    allHires = data;

    renderHires();
    updateCounter();

  } catch (err) {
    console.error("Failed to fetch hires:", err);
  }
}

// ===============================
// RENDER TABLE
// ===============================
function renderHires() {
  const tbody = document.getElementById("hireTableBody");
  tbody.innerHTML = "";

  let filtered = allHires;

  if (currentFilter !== "all") {
    filtered = allHires.filter(h => h.status === currentFilter);
  }

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="13">No requests found</td></tr>`;
    return;
  }

  filtered.forEach(hire => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${hire.full_name}</td>
      <td>${hire.phone}</td>
      <td>${hire.email || "-"}</td>
      <td>${hire.car_name}</td>
      <td>KSh ${Number(hire.daily_rate).toLocaleString()}</td>
      <td>KSh ${Number(hire.total_cost).toLocaleString()}</td>
      <td>${hire.total_days}</td>
      <td>${formatDate(hire.pickup_date)}</td>
      <td>${formatDate(hire.return_date)}</td>
      <td>${hire.pickup_location}</td>
      <td class="notes-cell" title="${hire.notes || ""}">
        ${truncateText(hire.notes || "-", 20)}
      </td>
      <td>${getStatusBadge(hire.status)}</td>
      <td>${getActionButtons(hire)}</td>
    `;

    tbody.appendChild(row);
  });
}

// ===============================
// STATUS BADGE
// ===============================
function getStatusBadge(status) {
  if (status === "approved") {
    return `<span class="status approved">✔ Approved</span>`;
  }
  if (status === "rejected") {
    return `<span class="status rejected">✖ Rejected</span>`;
  }
  return `<span class="status pending">⏳ Pending</span>`;
}

// ===============================
// ACTION BUTTONS
// ===============================
function getActionButtons(hire) {
  if (hire.status !== "pending") {
    return `<span style="color:gray;">No action</span>`;
  }

  return `
    <button class="approve-btn" 
      onclick="approveHire(${hire.id})"
      title="Approve this request">
      ✔
    </button>

    <button class="reject-btn" 
      onclick="openRejectModal(${hire.id})"
      title="Reject this request">
      ✖
    </button>
  `;
}

// ===============================
// APPROVE
// ===============================
async function approveHire(id) {
  if (!confirm("Approve this hire request?")) return;

  try {
    await fetch(`http://localhost:5000/api/car-hire/admin/${id}/approve`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminId: 1 }) // replace with real admin
    });

    // Update locally
    const hire = allHires.find(h => h.id === id);
    hire.status = "approved";

    renderHires();
    updateCounter();

  } catch (err) {
    console.error(err);
    alert("Failed to approve");
  }
}

// ===============================
// REJECT
// ===============================
let currentRejectId = null;

// OPEN MODAL
function openRejectModal(id) {
  currentRejectId = id;
  document.getElementById("rejectModal").classList.remove("hidden");
}

// CLOSE MODAL
function closeRejectModal() {
  currentRejectId = null;
  document.getElementById("rejectModal").classList.add("hidden");
  document.getElementById("rejectReasonInput").value = "";
}

// SUBMIT REJECTION
async function submitRejection() {
  const reason = document.getElementById("rejectReasonInput").value;

  if (!reason) {
    alert("Please enter a rejection reason");
    return;
  }

  try {
    await fetch(`http://localhost:5000/api/car-hire/admin/${currentRejectId}/reject`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rejectionReason: reason,
        adminId: 1
      })
    });

    const hire = allHires.find(h => h.id === currentRejectId);
    hire.status = "rejected";

    closeRejectModal();
    renderHires();
    updateCounter();

  } catch (err) {
    console.error(err);
    alert("Failed to reject");
  }
}

// ===============================
// FILTERS
// ===============================
function setupFilters() {
  const buttons = document.querySelectorAll(".filter-btn");

  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelector(".filter-btn.active")?.classList.remove("active");
      btn.classList.add("active");

      currentFilter = btn.dataset.filter;
      renderHires();
    });
  });
}

// ===============================
// COUNTER
// ===============================
function updateCounter() {
  const pendingCount = allHires.filter(h => h.status === "pending").length;

  const sidebarCounter = document.getElementById("hireCounter");
  const headerCounter = document.getElementById("hireCounterHeader");

  if (sidebarCounter) sidebarCounter.textContent = pendingCount;
  if (headerCounter) headerCounter.textContent = pendingCount;
}

// ===============================
// HELPERS
// ===============================
function formatDate(date) {
  return new Date(date).toLocaleDateString();
}

function truncateText(text, max) {
  if (text.length <= max) return text;
  return text.substring(0, max) + "...";
}