// index.js – FINAL WORKING VERSION for AI Undercover backend
// Uses Supabase + proper column mapping so inserts ALWAYS succeed.

const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

// ---------- SUPABASE CLIENT ----------
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// ---------- ROOT ----------
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
    const body = req.body || {};

    // Map camelCase fields → snake_case columns in Supabase
    const rowToInsert = {
      participant_id: body.participantId || null,
      difficulty: body.difficulty || null,
      scenario_id: body.scenarioId || null,
      scenario_context: body.scenarioContext || null,
      scenario_message: body.scenarioMessage || null,
      ai_type: body.aiType || null,

      selected_tactic_id: body.selectedTacticId || null,
      selected_tactic_name: body.selectedTacticName || null,
      correct_tactic_id: body.correctTacticId || null,
      correct_tactic_name: body.correctTacticName || null,

      correct: body.correct ?? null,
      base_score: body.baseScore ?? null,
      time_bonus: body.timeBonus ?? null,
      reasoning_bonus: body.reasoningBonus ?? null,
      streak_bonus: body.streakBonus ?? null,
      total_score: body.totalScore ?? null,
      time_taken_seconds: body.timeTakenSeconds ?? null,

      confidence: body.confidence ?? null,
      reasoning: body.reasoning || null,
    };

    const { data, error } = await supabase
      .from("comments")
      .insert([rowToInsert]);

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

// ---------- DOWNLOAD ALL COMMENTS AS CSV ----------
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
      return res.status(404).send("No comments yet. Play the game first.");
    }

    // Convert rows → CSV
    const escape = (v) => {
      if (v === null || v === undefined) return "";
      const s = String(v);
      if (s.includes(",") || s.includes("\n") || s.includes('"')) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };

    const header = Object.keys(data[0]);
    const rows = data.map((row) =>
      header.map((h) => escape(row[h])).join(",")
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
    console.error("❌ CSV generation error:", err);
    res.status(500).send("Failed to generate CSV");
  }
});

// ---------- START SERVER ----------
app.listen(PORT, () => {
  console.log(`🟢 Supabase-backed server running on port ${PORT}`);
});
