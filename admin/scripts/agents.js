// ----------------------------
// AGENTS.JS – UPDATED
// ----------------------------
window.addEventListener("DOMContentLoaded", () => {
  const role = localStorage.getItem("role")?.toLowerCase();

if (role !== "admin") {
  console.log("Agents.js blocked for non-admin");
  return;
}
  // ----------------------------
  // ELEMENTS
  // ----------------------------
  const addAgentBtn = document.getElementById("addAgentBtn");
  const agentFormContainer = document.getElementById("agentFormContainer");
  const cancelAgentBtn = document.getElementById("cancelAgentBtn");
  const agentForm = document.getElementById("agentForm");
  const agentsList = document.getElementById("agentsList");

  const API_URL = "http://localhost:5000/api/agents";
  const token = localStorage.getItem("token");

  if (!addAgentBtn || !agentFormContainer || !cancelAgentBtn || !agentForm || !agentsList) {
    console.error("Agent elements missing in DOM");
    return;
  }

  // ----------------------------
  // UI HANDLING
  // ----------------------------

  // Show form
  addAgentBtn.addEventListener("click", () => {
    agentFormContainer.classList.remove("hidden");
  });

  // Hide form
  cancelAgentBtn.addEventListener("click", () => {
    agentFormContainer.classList.add("hidden");
    agentForm.reset();
  });

  // ----------------------------
  // CREATE AGENT
  // ----------------------------
  agentForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("agentName").value.trim();
    const email = document.getElementById("agentEmail").value.trim();
    const phone = document.getElementById("agentPhone").value.trim();

    if (!name || !email || !phone) {
      return alert("All fields are required");
    }

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name, email, phone })
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to create agent");

      alert("Agent created successfully. Email sent.");

      agentForm.reset();
      agentFormContainer.classList.add("hidden");

      loadAgents();

    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  });

  const statusFilter = document.getElementById("statusFilter");

  statusFilter.addEventListener("change", () => {
    loadAgents(statusFilter.value);
  });

  // New filter element
  const verifiedFilter = document.getElementById("verifiedFilter");

  // Reload agents when verified filter changes
  verifiedFilter.addEventListener("change", () => {
    loadAgents(statusFilter.value, verifiedFilter.value);
  });

  // ----------------------------
  // LOAD AGENTS
  // ----------------------------
async function loadAgents(filterStatus = "all", filterVerified = "all") {
  try {
    const res = await fetch(API_URL, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.error || "Failed to load agents");

    let filteredAgents = data;

    // Filter by status
    if (filterStatus !== "all") {
      filteredAgents = filteredAgents.filter(agent => agent.status === filterStatus);
    }

    // Filter by verified
    if (filterVerified !== "all") {
      const isVerified = filterVerified === "verified";
      filteredAgents = filteredAgents.filter(agent => agent.is_verified === isVerified);
    }

    renderAgents(filteredAgents);

  } catch (err) {
    console.error(err);
    agentsList.innerHTML = `<p>Failed to load agents</p>`;
  }
}

  // ----------------------------
  // RENDER AGENTS
  // ----------------------------
  function renderAgents(agents) {
    agentsList.innerHTML = "";

    if (!agents.length) {
      agentsList.innerHTML = "<p>No agents found</p>";
      return;
    }

    agents.forEach(agent => {
      const card = document.createElement("div");
      card.classList.add("agent-card");

      card.innerHTML = `
        <h4>${agent.name}</h4>
        <p>Email: ${agent.email}</p>
        <p>Phone: ${agent.phone}</p>
        <p class="agent-status ${agent.status === "active" ? "status-active" : "status-suspended"}">
          ${agent.status.toUpperCase()}
        </p>

        <div class="agent-actions">
          ${
            agent.status === "active"
              ? `<button class="suspend-btn">Suspend</button>`
              : `<button class="activate-btn">Activate</button>`
          }
          <button class="delete-btn">Delete</button>
        </div>
      `;

      // ----------------------------
      // STATUS TOGGLE HANDLERS
      // ----------------------------
      const statusBtn = card.querySelector(".suspend-btn, .activate-btn");
      statusBtn?.addEventListener("click", () => {
        const newStatus = agent.status === "active" ? "suspended" : "active";
        const action = newStatus === "active" ? "activate" : "suspend";

        if (confirm(`Are you sure you want to ${action} this agent?`)) {
          toggleStatus(agent.id, newStatus);
        }
      });

      // ----------------------------
      // DELETE AGENT HANDLER
      // ----------------------------
      const deleteBtn = card.querySelector(".delete-btn");
      deleteBtn?.addEventListener("click", () => deleteAgent(agent.id));

      agentsList.appendChild(card);
    });
  }

  // ----------------------------
  // UPDATE STATUS
  // ----------------------------
  async function toggleStatus(id, newStatus) {
    try {
      const res = await fetch(`${API_URL}/${id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to update status");

      loadAgents();

    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  }

  // ----------------------------
  // DELETE AGENT
  // ----------------------------
  async function deleteAgent(id) {
    if (!confirm("Delete this agent permanently?")) return;

    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete agent");
      }

      loadAgents();

    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  }

  const generateAgentReportBtn = document.getElementById("generateAgentReportBtn");

  generateAgentReportBtn?.addEventListener("click", async () => {
    const status = statusFilter.value;
    const verified = verifiedFilter.value;

    try {
      const res = await fetch(
        `http://localhost:5000/api/agents/agents?status=${status}&verified=${verified}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (!res.ok) throw new Error("Failed to generate report");

      const blob = await res.blob(); // Get PDF as blob
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "agents_report.pdf"; // Set default filename
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  });

  // ----------------------------
  // INITIAL LOAD
  // ----------------------------
  if (role === "admin") {
    loadAgents();
  }
});