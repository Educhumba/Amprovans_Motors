// ----------------------------
// AGENTS.JS – UPDATED
// ----------------------------
window.addEventListener("DOMContentLoaded", () => {
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

  // ----------------------------
  // LOAD AGENTS
  // ----------------------------
  async function loadAgents() {
    try {
      const res = await fetch(API_URL, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to load agents");

      renderAgents(data);

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
        toggleStatus(agent.id, newStatus);
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

  // ----------------------------
  // INITIAL LOAD
  // ----------------------------
  loadAgents();
});