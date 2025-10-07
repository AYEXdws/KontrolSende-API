// server.js (ESM)
import express from "express";
import cors from "cors";
import { neon } from "@neondatabase/serverless";

const app = express();
const sql = neon(process.env.DATABASE_URL);

// JSON cache kapat (stale veri olmasın)
app.use((req, res, next) => { res.set('Cache-Control','no-store'); next(); });

// CORS — şimdilik test için * (istersen domain’e daraltırız)
app.use(cors({
  origin: "*",
  methods: ["GET","POST","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type"]
}));
app.options("*", cors());

app.use(express.json());

// Health check
app.get("/", (req, res) => res.json({ ok: true }));

/* =========================
   EVENTS
   ========================= */
// Ekle (admin: {title, desc, img, video})
app.post("/addEvent", async (req, res) => {
  try {
    const { title, desc, img, video } = req.body;
    if (!title) return res.status(400).json({ success:false, error:"title required" });
    await sql`
      INSERT INTO events (title, description, image_url, video_url)
      VALUES (${title}, ${desc || null}, ${img || null}, ${video || null})
    `;
    res.json({ success:true });
  } catch (e) {
    console.error("addEvent:", e);
    res.status(500).json({ success:false, error:String(e) });
  }
});

// Liste (etkinlikler.html & admin)
app.get("/events", async (req, res) => {
  try {
    const rows = await sql`
      SELECT id, title, description, image_url, video_url, created_at
      FROM events
      ORDER BY id DESC
      LIMIT 200
    `;
    res.status(200).json(rows); // DİREKT DİZİ döndür
  } catch (e) {
    console.error("events:", e);
    res.status(500).json({ success:false, error:String(e) });
  }
});

// Sil (admin)
app.post("/deleteEvent", async (req, res) => {
  try {
    const { id } = req.body || {};
    if (!id) return res.status(400).json({ success:false, error:"id required" });
    await sql`DELETE FROM events WHERE id = ${Number(id)}`;
    res.json({ success:true });
  } catch (e) {
    console.error("deleteEvent:", e);
    res.status(500).json({ success:false, error:String(e) });
  }
});

/* =========================
   RESULTS (test)
   ========================= */
app.post("/addResult", async (req, res) => {
  try {
    const { total_pct, cats } = req.body;
    if (typeof total_pct !== "number" || !Array.isArray(cats))
      return res.status(400).json({ success:false, error:"invalid payload" });
    await sql`
      INSERT INTO results (total_pct, cats)
      VALUES (${total_pct}, ${JSON.stringify(cats)}::jsonb)
    `;
    res.json({ success:true });
  } catch (e) {
    console.error("addResult:", e);
    res.status(500).json({ success:false, error:String(e) });
  }
});

app.get("/results", async (req, res) => {
  try {
    const rows = await sql`
      SELECT id, total_pct, cats, created_at
      FROM results
      ORDER BY id DESC
      LIMIT 200
    `;
    res.status(200).json(rows); // DİREKT DİZİ döndür
  } catch (e) {
    console.error("results:", e);
    res.status(500).json({ success:false, error:String(e) });
  }
});

app.post("/deleteResult", async (req, res) => {
  try {
    const { id } = req.body || {};
    if (!id) return res.status(400).json({ success:false, error:"id required" });
    await sql`DELETE FROM results WHERE id = ${Number(id)}`;
    res.json({ success:true });
  } catch (e) {
    console.error("deleteResult:", e);
    res.status(500).json({ success:false, error:String(e) });
  }
});

// Start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("✅ API listening on", PORT));
