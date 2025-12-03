// index.js (Node backend using Supabase instead of CSV)

const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { createClient } = require("@supabase/supabase-js");

// Create Supabase client (backend only – secure keys)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Loud logging so we can debug
console.log("🚀 Backend starting...");
console.log("🔗 Using Supabase URL:", process.env.SUPABASE_URL);
console.log("🔐 Service key loaded?", !!process.env.SUPABASE_SERVICE_KEY);

// ---------- HEALTH CHECK ----------
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// ---------- SAVE ONE GAME ROUND ----------
app.post("/comments", async (req, res) => {
  console.log("📥 Received /comments POST:", req.body);

  try {
    const { data, error } = await supabase
      .from("comments")
      .insert([req.body]); // insert row exactly as sent

    if (error) {
      console.error("❌ Supabase Insert Error:", error);
      return res.status(500).json({ message: "Failed to save comment" });
    }

    console.log("✅ Saved to Supabase:", data);
    return res.status(201).json({ message: "Comment saved" });

  } catch (err) {
    console.error("❌ Unexpected Error:", err);
    return res.status(500).json({ message: "Unexpected server error" });
  }
});

// ---------- DOWNLOAD ALL DATA AS CSV ----------
app.get("/download-comments", async (req, res) => {
  console.log("📤 /download-comments requested");

  try {
    const { data, error } = await supabase
      .from("comments")
      .select("*");

    if (error) {
      console.error("❌ Supabase Select Error:", error);
      return res.status(500).send("Error fetching comments");
    }

    if (!data || data.length === 0) {
      console.log("⚠️ No data in Supabase yet");
      return res.status(404).send("No comments found");
    }

    // --- Convert JSON → CSV ---
    const escapeValue = (value) => {
      if (value === null || value === undefined) return "";
      const str = String(value);
      if (str.includes(",") || str.includes("\n") || str.includes('"')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const header = Object.keys(data[0]);
    const rows = data.map((row) =>
      header.map((col) => escapeValue(row[col])).join(",")
    );

    const csv = [header.join(","), ...rows].join("\n");

    // Send the CSV
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=comments.csv"
    );
    res.status(200).send(csv);

    console.log("✅ CSV download sent");

  } catch (err) {
    console.error("❌ CSV Generation Error:", err);
    res.status(500).send("Failed to generate CSV");
  }
});

// ---------- START SERVER ----------
app.listen(PORT, () => {
  console.log(`🟢 Supabase-backed server running on port ${PORT}`);
});
