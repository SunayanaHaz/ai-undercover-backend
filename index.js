// index.js – Backend using Supabase, with /download-comments working

const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

// ---------- SETUP SUPABASE CLIENT ----------
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Extra logs so we see what’s happening
console.log("🚀 Backend starting...");
console.log("🔗 SUPABASE_URL:", supabaseUrl);
console.log("🔐 Service key loaded?", !!supabaseServiceKey);

// ---------- ROOT ROUTE (just for sanity check) ----------
app.get("/", (req, res) => {
  res.send("👍 AI Undercover backend is running");
});

// ---------- HEALTH CHECK ----------
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// ---------- SAVE ONE GAME ROUND ----------
app.post("/comments", async (req, res) => {
  console.log("📥 POST /comments body:", req.body);

  try {
    // Insert exactly what the game sends into the "comments" table
    const { data, error } = await supabase
      .from("comments")
      .insert([req.body]);

    if (error) {
      console.error("❌ Supabase insert error:", error);
      return res.status(500).json({ message: "Failed to save comment" });
    }

    console.log("✅ Saved row in Supabase:", data);
    return res.status(201).json({ message: "Comment saved" });
  } catch (err) {
    console.error("❌ Unexpected error in /comments:", err);
    return res.status(500).json({ message: "Unexpected server error" });
  }
});

// ---------- DOWNLOAD ALL DATA AS CSV ----------
app.get("/download-comments", async (req, res) => {
  console.log("📤 GET /download-comments called");

  try {
    const { data, error } = await supabase
      .from("comments")
      .select("*");

    if (error) {
      console.error("❌ Supabase select error:", error);
      return res.status(500).send("Error fetching comments");
    }

    if (!data || data.length === 0) {
      console.log("⚠️ No comments in database");
      return res
        .status(404)
        .send("No comments yet. Play the game first to generate data.");
    }

    // Turn rows into CSV
    const escapeValue = (value) => {
      if (value === null || value === undefined) return "";
      const str = String(value);
      if (str.includes(",") || str.includes("\n") || str.includes('"')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const header = Object.keys(data[0]); // column names
    const rows = data.map((row) =>
      header.map((col) => escapeValue(row[col])).join(",")
    );

    const csv = [header.join(","), ...rows].join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=comments.csv"
    );
    res.status(200).send(csv);

    console.log("✅ CSV sent to client");
  } catch (err) {
    console.error("❌ Error in /download-comments:", err);
    res.status(500).send("Failed to generate CSV");
  }
});

// ---------- START SERVER ----------
app.listen(PORT, () => {
  console.log(`🟢 Supabase-backed server running on port ${PORT}`);
});
