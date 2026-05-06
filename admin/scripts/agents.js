// ----------------------------
// AGENTS.JS – UPDATED
// ----------------------------
function onlyLetters(value) {
  return value.replace(/[^a-zA-Z\s]/g, "");
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function formatKenyanPhone(value) {
  let phone = value.replace(/[^0-9+]/g, "");

  // convert 07XXXXXXXX → +2547XXXXXXXX
  if (phone.startsWith("07")) {
    phone = "+254" + phone.substring(1);
  }

  // convert 01XXXXXXXX → +2541XXXXXXXX
  else if (phone.startsWith("01")) {
    phone = "+254" + phone.substring(1);
  }

  // enforce +254 format max length (13 chars total)
  if (phone.startsWith("+254")) {
    phone = phone.slice(0, 13);
  }

  return phone;
}

const suspendModal = document.getElementById("suspendModal");
const suspendReasonInput = document.getElementById("suspendReasonInput");
const confirmSuspendBtn = document.getElementById("confirmSuspendBtn");
const cancelSuspendBtn = document.getElementById("cancelSuspendBtn");

let selectedAgentId = null;
let selectedNewStatus = null;

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

  
      // Confirm suspend
      confirmSuspendBtn?.addEventListener("click", () => {
        const reason = suspendReasonInput.value.trim();

        if (!reason) {
          return Swal.fire({
            icon: "warning",
            title: "Missing reason",
            text: "Please provide a suspension reason"
          });
        }

        // Store reason locally (temporary, not backend)
        localStorage.setItem(`agent_suspend_reason_${selectedAgentId}`, reason);

        toggleStatus(selectedAgentId, selectedNewStatus);

        suspendModal.classList.add("hidden");
      });

      // Cancel suspend
      cancelSuspendBtn?.addEventListener("click", () => {
        suspendModal.classList.add("hidden");
      });

const nameInput = document.getElementById("agentName");
const emailInput = document.getElementById("agentEmail");
const phoneInput = document.getElementById("agentPhone");

// NAME → letters only
nameInput.addEventListener("input", (e) => {
  e.target.value = onlyLetters(e.target.value);
});

// PHONE
phoneInput.addEventListener("input", (e) => {
  let value = e.target.value;
  // allow digits and optional leading +
  value = value.replace(/[^0-9+]/g, "");
  // only allow + at the start
  if (value.indexOf("+") > 0) {
    value = value.replace(/\+/g, "");
  }
  // enforce max length (Kenya max realistic length = 13 incl +254 OR 10–12 digits local)
  if (value.startsWith("+")) {
    value = value.slice(0, 13);
  } else {
    value = value.slice(0, 10);
  }
  e.target.value = value;
});

  // ----------------------------
  // CREATE AGENT
  // ----------------------------
  agentForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("agentName").value.trim();
    const email = document.getElementById("agentEmail").value.trim();
    const phone = document.getElementById("agentPhone").value.trim();

    // NAME validation
    if (!/^[a-zA-Z\s]+$/.test(name)) {
      return Swal.fire({
        icon: "warning",
        title: "Invalid Name",
        text: "Name can only contain letters"
      });
    }

    // EMAIL validation
    if (!validateEmail(email)) {
      return Swal.fire({
        icon: "warning",
        title: "Invalid Email",
        text: "Enter a valid email address"
      });
    }

    // PHONE validation (Kenya format)
    const phoneRegex = /^(\+?\d{9,13})$/;
    if (!phoneRegex.test(phone)) {
      return Swal.fire({
        icon: "warning",
        title: "Invalid Phone Number",
        text: "Use format 07XXXXXXXX or +2547XXXXXXXX"
      });
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

      Toast.fire({
        icon: "success",
        title: "Agent created successfully. Email sent."
      });

      agentForm.reset();
      agentFormContainer.classList.add("hidden");

      loadAgents();

    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message
      });
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

      const suspendReason = localStorage.getItem(`agent_suspend_reason_${agent.id}`);

      const card = document.createElement("div");
      card.classList.add("agent-card");

      card.innerHTML = `
        <h4>${agent.name}</h4>
        <p>Email: ${agent.email}</p>
        <p>Phone: ${agent.phone}</p>
        <p class="agent-status ${agent.status === "active" ? "status-active" : "status-suspended"}">
          ${agent.status.toUpperCase()}
        </p>
        ${
          agent.status === "suspended" && suspendReason
            ? `<p class="suspend-reason">Reason: ${suspendReason}</p>`
            : ""
        }

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

        // If suspending → open modal
        if (newStatus === "suspended") {
          selectedAgentId = agent.id;
          selectedNewStatus = newStatus;

          suspendReasonInput.value = "";
          suspendModal.classList.remove("hidden");
        } 
        // If activating → no modal
        else {
          Swal.fire({
            title: "Activate agent?",
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Yes, activate",
          }).then(result => {
            if (result.isConfirmed) {
              toggleStatus(agent.id, newStatus);
            }
          });
          return;
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
      Toast.fire({
        icon: "success",
        title: "Agent status updated"
      });

      loadAgents();

    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Update failed",
        text: err.message
      });
    }
  }

  // ----------------------------
  // DELETE AGENT
  // ----------------------------
  async function deleteAgent(id) {
    const result = await Swal.fire({
      title: "Delete agent?",
      text: "This action cannot be undone",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete"
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete agent");
      }
      Toast.fire({
        icon: "success",
        title: "Agent deleted successfully"
      });

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
      Swal.fire({
        icon: "error",
        title: "Export failed",
        text: err.message
      });
    }
  });

  // ----------------------------
  // INITIAL LOAD
  // ----------------------------
  if (role === "admin") {
    loadAgents();
  }
});