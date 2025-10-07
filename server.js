// server.js
import express from "express";
import cors from "cors";
import { neon } from "@neondatabase/serverless";

const app = express();

// --- CORS ---
const ALLOWED = [
  "https://ayexdws.github.io",        // project pages origin budur
  "https://kontrolsende-api.onrender.com" // kendi testlerin için
];
app.use(cors({
  origin: (origin, cb) => {
    // local testlerde origin null olabilir
    if (!origin) return cb(null, true);
    cb(null, ALLOWED.includes(origin));
  },
  methods: ["GET","POST","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type"]
}));
app.options("*", cors()); // preflight

app.use(express.json());

// --- DB ---
const sql = neon(process.env.DATABASE_URL);

// Sağlık kontrolü
app.get("/", (req, res) => res.json({ ok: true }));

/* =========================
   RESULTS
   ========================= */

// addResult  (frontend POST ile çağırıyor)
app.post("/addResult", async (req, res) => {
  try {
    const { total_pct, cats } = req.body;
    if (typeof total_pct !== "number" || !Array.isArray(cats)) {
      return res.status(400).json({ success:false, error:"Invalid payload" });
    }
    await sql`
      INSERT INTO results (total_pct, cats)
      VALUES (${total_pct}, ${JSON.stringify(cats)}::jsonb)
    `;
    res.json({ success:true });
  } catch (e) {
    console.error("addResult:", e);
    res.status(500).json({ success:false });
  }
});

// results  (frontend GET /results bekliyor)
app.get("/results", async (req, res) => {
  try {
    const rows = await sql`
      SELECT id, total_pct, cats, created_at
      FROM results ORDER BY id DESC LIMIT 200
    `;
    res.json(rows); // sade dizi döndürüyoruz (frontend böyle bekliyor)
  } catch (e) {
    console.error("results:", e);
    res.status(500).json({ success:false });
  }
});

// deleteResult (2 sürüm: POST body ile VEYA DELETE /:id)
app.post("/deleteResult", async (req, res) => {
  try {
    const { id } = req.body || {};
    if (!id) return res.status(400).json({ success:false, error:"id required" });
    await sql`DELETE FROM results WHERE id = ${Number(id)}`;
    res.json({ success:true });
  } catch (e) {
    console.error("deleteResult(POST):", e);
    res.status(500).json({ success:false });
  }
});
app.delete("/deleteResult/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ success:false, error:"invalid id" });
    await sql`DELETE FROM results WHERE id = ${id}`;
    res.json({ success:true });
  } catch (e) {
    console.error("deleteResult(DELETE):", e);
    res.status(500).json({ success:false });
  }
});

/* =========================
   EVENTS
   ========================= */

// addEvent  (frontend POST /addEvent {title, desc, img})
app.post("/addEvent", async (req, res) => {
  try {
    const { title, desc, img } = req.body;
    if (!title || !img) {
      return res.status(400).json({ success:false, error:"title & img required" });
    }
    await sql`
      INSERT INTO events (title, description, image_url)
      VALUES (${title}, ${desc || null}, ${img})
    `;
    res.json({ success:true });
  } catch (e) {
    console.error("addEvent:", e);
    res.status(500).json({ success:false });
  }
});

// events (frontend GET /events bekliyor)
app.get("/events", async (req, res) => {
  try {
    const rows = await sql`
      SELECT id, title, description, image_url, created_at
      FROM events ORDER BY id DESC LIMIT 200
    `;
    res.json(rows); // sade dizi
  } catch (e) {
    console.error("events:", e);
    res.status(500).json({ success:false });
  }
});

// deleteEvent (2 sürüm: POST body ile VEYA DELETE /:id)
app.post("/deleteEvent", async (req, res) => {
  try {
    const { id } = req.body || {};
    if (!id) return res.status(400).json({ success:false, error:"id required" });
    await sql`DELETE FROM events WHERE id = ${Number(id)}`;
    res.json({ success:true });
  } catch (e) {
    console.error("deleteEvent(POST):", e);
    res.status(500).json({ success:false });
  }
});
app.delete("/deleteEvent/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ success:false, error:"invalid id" });
    await sql`DELETE FROM events WHERE id = ${id}`;
    res.json({ success:true });
  } catch (e) {
    console.error("deleteEvent(DELETE):", e);
    res.status(500).json({ success:false });
  }
});

// --- Start ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("✅ API listening on", PORT));
