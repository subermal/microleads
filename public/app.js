// app.js
// Frontend logic for microleads:
// - submit form to create leads
// - fetch and render leads
// - apply filters
// - update status via buttons

const gridBody = document.querySelector("#grid tbody");
const form = document.querySelector("#newLead");
const q = document.querySelector("#q");
const statusSel = document.querySelector("#status");
const applyFiltersBtn = document.querySelector("#applyFilters");
const formError = document.querySelector("#formError");
const counts = document.querySelector("#counts");

// Simple email validation on client side (same idea as server)
function isValidEmailClient(email) {
  if (!email) return false;
  const trimmed = email.trim();
  return trimmed.includes("@") && trimmed.includes(".") && trimmed.length >= 5;
}

// Escape HTML to avoid XSS when inserting user content into innerHTML
function escapeHtml(text) {
  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Format createdAt date nicely
function formatDate(isoString) {
  if (!isoString) return "";
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleString(); // local date + time
}

// Show inline form error message
function setFormError(message) {
  formError.textContent = message || "";
}

// Handle new lead form submission
form.addEventListener("submit", async (e) => {
  e.preventDefault(); // prevent page reload
  setFormError("");

  const data = Object.fromEntries(new FormData(form).entries());

  // Client-side checks for nicer UX
  if (!data.name || !data.name.trim()) {
    setFormError("Please enter a name.");
    return;
  }
  if (!isValidEmailClient(data.email)) {
    setFormError("Please enter a valid email.");
    return;
  }

  try {
    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setFormError(body.error || "Could not create lead.");
      return;
    }

    form.reset();
    await loadLeads();
  } catch (err) {
    console.error(err);
    setFormError("Network error. Please try again.");
  }
});

// Build a table row string for a single lead
function row(lead) {
  const created = formatDate(lead.createdAt);
  return `<tr>
    <td>${escapeHtml(lead.name)}</td>
    <td>${escapeHtml(lead.email)}</td>
    <td>${escapeHtml(lead.company)}</td>
    <td>${escapeHtml(lead.source)}</td>
    <td>${escapeHtml(lead.status)}</td>
    <td>${escapeHtml(created)}</td>
    <td>
      <button class="link" data-id="${lead.id}" data-status="Contacted">Contacted</button>
      <button class="link" data-id="${lead.id}" data-status="Qualified">Qualified</button>
      <button class="link" data-id="${lead.id}" data-status="Lost">Lost</button>
      <button class="link" data-id="${lead.id}" data-status="Won">Won</button>
    </td>
  </tr>`;
}

// Attach click handlers to all action buttons in the table
function bindActions() {
  document.querySelectorAll("#grid button.link").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      const status = btn.dataset.status;

      try {
        const res = await fetch(`/api/leads/${encodeURIComponent(id)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status })
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          alert(body.error || "Failed to update lead.");
          return;
        }

        // Reload table after successful update
        await loadLeads();
      } catch (err) {
        console.error(err);
        alert("Network error while updating lead.");
      }
    });
  });
}

// Load leads with filters, and update table + counts
async function loadLeads() {
  const params = new URLSearchParams();
  if (q.value.trim()) params.set("q", q.value.trim());
  if (statusSel.value) params.set("status", statusSel.value);

  try {
    // my touch: fetch total leads and filtered leads to show "X of Y"
    const [allRes, filteredRes] = await Promise.all([
      fetch("/api/leads"),
      fetch("/api/leads?" + params.toString())
    ]);

    if (!allRes.ok || !filteredRes.ok) {
      throw new Error("Failed to fetch leads.");
    }

    const allLeads = await allRes.json();
    const leads = await filteredRes.json();

    gridBody.innerHTML = leads.map(row).join("");
    bindActions();

    if (allLeads.length === 0) {
      counts.textContent = "No leads yet. Add your first lead above.";
    } else if (params.toString()) {
      counts.textContent = `Showing ${leads.length} of ${allLeads.length} leads.`;
    } else {
      counts.textContent = `Showing all ${allLeads.length} leads.`;
    }
  } catch (err) {
    console.error(err);
    gridBody.innerHTML = "";
    counts.textContent = "Could not load leads. Please try again later.";
  }
}

// Apply filters when clicking the "Apply filters" button
applyFiltersBtn.addEventListener("click", () => {
  loadLeads();
});

// Optionally, react as user types in search (you can keep just click if you prefer)
q.addEventListener("keyup", (e) => {
  if (e.key === "Enter") loadLeads();
});

// Initial load on page open
loadLeads();

