import express from "express";
import cors from "cors";
import { neon } from "@neondatabase/serverless";

const app = express();
const sql = neon(process.env.DATABASE_URL);

// Sadece kendi sitenden çağrı izni ver (GitHub Pages)
const ALLOWED = [
  "https://ayexdws.github.io",
  "https://ayexdws.github.io/KontrolSende/"
];
app.use(cors({ origin: (origin, cb) => cb(null, !origin || ALLOWED.includes(origin)) }));
app.use(express.json());

// Basit sağlık kontrolü
app.get("/", (req, res) => res.json({ ok: true }));

// ---- RESULTS ----
app.post("/addResult", async (req, res) => {
  try {
    const { total_pct, cats } = req.body;
    if (typeof total_pct !== "number" || !Array.isArray(cats))
      return res.status(400).json({ success: false, error: "Invalid payload" });

    await sql`
      INSERT INTO results (total_pct, cats)
      VALUES (${total_pct}, ${JSON.stringify(cats)}::jsonb)
    `;
    res.json({ success: true });
  } catch (e) {
    console.error("addResult:", e);
    res.status(500).json({ success: false });
  }
});

app.get("/getResults", async (req, res) => {
  try {
    const rows = await sql`
      SELECT id, total_pct, cats, created_at
      FROM results ORDER BY id DESC LIMIT 100
    `;
    res.json({ success: true, rows });
  } catch (e) {
    console.error("getResults:", e);
    res.status(500).json({ success: false });
  }
});

// ---- EVENTS ----
app.post("/addEvent", async (req, res) => {
  try {
    const { title, description, image_url } = req.body;
    if (!title || !image_url)
      return res.status(400).json({ success: false, error: "title & image_url required" });

    await sql`
      INSERT INTO events (title, description, image_url)
      VALUES (${title}, ${description || null}, ${image_url})
    `;
    res.json({ success: true });
  } catch (e) {
    console.error("addEvent:", e);
    res.status(500).json({ success: false });
  }
});

app.get("/getEvents", async (req, res) => {
  try {
    const rows = await sql`
      SELECT id, title, description, image_url, created_at
      FROM events ORDER BY id DESC LIMIT 200
    `;
    res.json({ success: true, rows });
  } catch (e) {
    console.error("getEvents:", e);
    res.status(500).json({ success: false });
  }
});

app.delete("/deleteEvent/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ success: false, error: "invalid id" });
    await sql`DELETE FROM events WHERE id = ${id}`;
    res.json({ success: true });
  } catch (e) {
    console.error("deleteEvent:", e);
    res.status(500).json({ success: false });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("✅ API listening on", PORT));
