import express from "express";
import cors from "cors";
import { neon } from "@neondatabase/serverless";

const app = express();
const sql  = neon(process.env.DATABASE_URL);

app.use((req,res,next)=>{res.set('Cache-Control','no-store');next();});
app.use(cors({ origin: "*", methods:["GET","POST","DELETE","OPTIONS"], allowedHeaders:["Content-Type"] }));
app.options("*", cors());
app.use(express.json());

app.get("/", (req,res)=>res.json({ok:true}));

// EVENTS
app.post("/addEvent", async (req,res)=>{
  try{
    const { title, desc, img, video } = req.body;
    if(!title) return res.status(400).json({success:false,error:"title required"});
    await sql`INSERT INTO events (title, description, image_url, video_url) VALUES (${title}, ${desc||null}, ${img||null}, ${video||null})`;
    res.json({success:true});
  }catch(e){ console.error("addEvent:",e); res.status(500).json({success:false}); }
});
app.get("/events", async (req,res)=>{
  try{
    const rows = await sql`SELECT id,title,description,image_url,video_url,created_at FROM events ORDER BY id DESC LIMIT 200`;
    res.status(200).json(rows);
  }catch(e){ console.error("events:",e); res.status(500).json({success:false}); }
});
app.post("/deleteEvent", async (req,res)=>{
  try{
    const { id } = req.body||{}; if(!id) return res.status(400).json({success:false});
    await sql`DELETE FROM events WHERE id=${Number(id)}`; res.json({success:true});
  }catch(e){ console.error("deleteEvent:",e); res.status(500).json({success:false}); }
});

// RESULTS
app.post("/addResult", async (req,res)=>{
  try{
    const { total_pct, cats } = req.body;
    if(typeof total_pct!=="number"||!Array.isArray(cats)) return res.status(400).json({success:false});
    await sql`INSERT INTO results (total_pct, cats) VALUES (${total_pct}, ${JSON.stringify(cats)}::jsonb)`;
    res.json({success:true});
  }catch(e){ console.error("addResult:",e); res.status(500).json({success:false}); }
});
app.get("/results", async (req,res)=>{
  try{
    const rows = await sql`SELECT id,total_pct,cats,created_at FROM results ORDER BY id DESC LIMIT 200`;
    res.status(200).json(rows);
  }catch(e){ console.error("results:",e); res.status(500).json({success:false}); }
});
app.post("/deleteResult", async (req,res)=>{
  try{
    const { id } = req.body||{}; if(!id) return res.status(400).json({success:false});
    await sql`DELETE FROM results WHERE id=${Number(id)}`; res.json({success:true});
  }catch(e){ console.error("deleteResult:",e); res.status(500).json({success:false}); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=>console.log("✅ API listening on", PORT));
