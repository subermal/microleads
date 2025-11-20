// server.js
// Express server for the MicroLeads app.
// It serves the frontend and exposes a small JSON API to manage leads.

const path = require("path"); // Built-in Node module for file paths
const fs = require("fs");     // Built-in Node module for file operations
const express = require("express"); // Third-party web framework

const app = express(); // Initialise the Express application

// Use Render's port if provided, otherwise default to 3000 locally
const PORT = process.env.PORT || 3000;

// Path to our JSON "database" file
const DATA = path.join(__dirname, "leads.json");

// Allowed statuses for leads (student touch: added "Won")
const ALLOWED_STATUSES = ["New", "Contacted", "Qualified", "Lost", "Won"];

// --- Middleware configuration ---
// Parse application/x-www-form-urlencoded (e.g. HTML form posts)
app.use(express.urlencoded({ extended: true }));
// Parse JSON bodies (sent by fetch from our frontend)
app.use(express.json());
// Serve static files (HTML, CSS, JS) from ./public folder
app.use(express.static(path.join(__dirname, "public")));

// --- Helper functions to read/write leads ---

// Safely read leads array from JSON file
function readLeads() {
  if (!fs.existsSync(DATA)) {
    // If the file doesn't exist yet, start with an empty list
    return [];
  }
  try {
    const text = fs.readFileSync(DATA, "utf8");
    const data = JSON.parse(text);
    // Always return an array
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error("Error reading leads.json:", err.message);
    return [];
  }
}

// Safely write leads array to JSON file
function writeLeads(leads) {
  try {
    fs.writeFileSync(DATA, JSON.stringify(leads, null, 2), "utf8");
  } catch (err) {
    console.error("Error writing leads.json:", err.message);
  }
}

// Very simple email validation (student touch: better than just "has @")
function isValidEmail(email) {
  if (!email) return false;
  const trimmed = email.trim();
  // Not a full RFC validator, just catches obvious mistakes
  return trimmed.includes("@") && trimmed.includes(".") && trimmed.length >= 5;
}

// --- API Routes ---

// [R]ead: GET /api/leads?q=&status=
// Returns all leads, optionally filtered by search query and status.
app.get("/api/leads", (req, res) => {
  const q = (req.query.q || "").toLowerCase().trim();
  const statusFilter = (req.query.status || "").toLowerCase().trim();

  let leads = readLeads();

  // Filter by search query if provided (name, email, company, source)
  if (q) {
    leads = leads.filter((l) => {
      const name = (l.name || "").toLowerCase();
      const email = (l.email || "").toLowerCase();
      const company = (l.company || "").toLowerCase();
      const source = (l.source || "").toLowerCase();
      return (
        name.includes(q) ||
        email.includes(q) ||
        company.includes(q) ||
        source.includes(q)
      );
    });
  }

  // Filter by status if provided
  if (statusFilter) {
    leads = leads.filter(
      (l) => (l.status || "").toLowerCase() === statusFilter
    );
  }

  res.json(leads);
});

// [C]reate: POST /api/leads
// Creates a new lead with validation.
app.post("/api/leads", (req, res) => {
  const { name, email, company, source, notes } = req.body;

  // Basic validation on server side
  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Name is required." });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: "A valid email is required." });
  }

  const leads = readLeads();

  const now = new Date();

  const lead = {
    id: Date.now().toString(),           // simple unique ID
    name: name.trim(),
    email: email.trim(),
    company: company ? company.trim() : "",
    source: source ? source.trim() : "",
    notes: notes ? notes.trim() : "",
    status: "New",                       // default status
    createdAt: now.toISOString()         // my touch: store created time
  };

  leads.push(lead);
  writeLeads(leads);

  res.status(201).json(lead);
});

// [U]pdate: PATCH /api/leads/:id
// Allows updating status and notes only.
app.patch("/api/leads/:id", (req, res) => {
  const leads = readLeads();
  const id = req.params.id;

  const idx = leads.findIndex((l) => l.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: "Lead not found." });
  }

  const { status, notes } = req.body;

  // If status is provided, validate it
  if (status !== undefined) {
    if (!ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({ error: "Invalid status value." });
    }
    leads[idx].status = status;
  }

  // If notes is provided, update it (even empty string is allowed)
  if (notes !== undefined) {
    leads[idx].notes = notes.trim();
  }

  writeLeads(leads);
  res.json(leads[idx]);
});

// Root route: serve index.html explicitly (optional, but clear)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Start the server
app.listen(PORT, () => {
  console.log(`MicroLeads server running at http://localhost:${PORT}`);
});
