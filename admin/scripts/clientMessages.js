// ===============================
// GLOBAL STATE
// ===============================
let allMessages = [];
let messageFilter = "all";

// ===============================
// INIT
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  fetchMessages();
  setupMessageFilters();
});

// ===============================
// FETCH MESSAGES
// ===============================
async function fetchMessages() {
  try {
    const res = await fetch("http://localhost:5000/api/client-messages/admin");
    const data = await res.json();

    allMessages = data;

    renderMessages();
    updateMessageCounter();

  } catch (err) {
    console.error("Failed to fetch messages:", err);
  }
}

// ===============================
// RENDER TABLE
// ===============================
function renderMessages() {
  const tbody = document.getElementById("messagesTableBody");
  tbody.innerHTML = "";

  let filtered = allMessages;

  if (messageFilter !== "all") {
    filtered = allMessages.filter(m => m.status === messageFilter);
  }

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6">No messages found</td></tr>`;
    return;
  }

  filtered.forEach(msg => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${msg.name}</td>
      <td>${msg.email}</td>
      <td>${msg.phone || "-"}</td>
      <td class="message-cell" title="${msg.message}">${truncateText(msg.message, 30)}</td>
      <td>${getMessageStatusBadge(msg.status)}</td>
      <td>${getMessageActionButtons(msg)}</td>
    `;

    tbody.appendChild(row);
  });
}

// ===============================
// STATUS BADGE
// ===============================
function getMessageStatusBadge(status) {
  if (status === "resolved") return `<span class="status resolved">✔ Resolved</span>`;
  return `<span class="status pending">⏳ Pending</span>`;
}

// ===============================
// ACTION BUTTONS
// ===============================
function getMessageActionButtons(msg) {
  if (msg.status === "resolved") {
    return `<span style="color:gray;">No action</span>`;
  }
  return `
    <button class="resolve-btn" 
      onclick="resolveMessage(${msg.id})"
      title="Mark as resolved">
      Resolved
    </button>
  `;
}

// ===============================
// RESOLVE MESSAGE
// ===============================
async function resolveMessage(id) {
  if (!confirm("Mark this message as resolved?")) return;

  try {
    await fetch(`http://localhost:5000/api/client-messages/admin/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "resolved" })
    });

    // Update locally
    const msg = allMessages.find(m => m.id === id);
    if (msg) msg.status = "resolved";

    renderMessages();
    updateMessageCounter();

  } catch (err) {
    console.error(err);
    alert("Failed to update status");
  }
}

// ===============================
// FILTERS
// ===============================
function setupMessageFilters() {
  const buttons = document.querySelectorAll("#messages .filter-btn");

  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelector("#messages .filter-btn.active")?.classList.remove("active");
      btn.classList.add("active");

      messageFilter = btn.dataset.filter;
      renderMessages();
    });
  });
}

// ===============================
// COUNTER
// ===============================
function updateMessageCounter() {
  const pendingCount = allMessages.filter(m => m.status === "pending").length;

  const sidebarCounter = document.getElementById("messagesCounter");

  if (sidebarCounter) sidebarCounter.textContent = pendingCount;
}

// ===============================
// HELPERS
// ===============================
function truncateText(text, max) {
  if (text.length <= max) return text;
  return text.substring(0, max) + "...";
}