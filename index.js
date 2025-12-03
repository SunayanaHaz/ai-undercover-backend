// index.js (Node backend - loud logging so we can debug)
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Path to CSV file
const csvPath = path.join(__dirname, "comments.csv");

// Log where we are saving the file
console.log("📁 CSV will be saved at:", csvPath);

// Make any value safe for CSV
function csvSafe(value) {
  if (value === undefined || value === null) return '""';
  const str = String(value).replace(/"/g, '""');
  return `"${str}"`;
}

// Ensure header exists
if (!fs.existsSync(csvPath)) {
  console.log("🧾 CSV file not found. Creating new one with header...");
  const header =
    [
      "timestamp",
      "participantId",
      "difficulty",
      "scenarioId",
      "scenarioContext",
      "scenarioMessage",
      "aiType",
      "selectedTacticId",
      "selectedTacticName",
      "correctTacticId",
      "correctTacticName",
      "correct",
      "baseScore",
      "timeBonus",
      "reasoningBonus",
      "streakBonus",
      "totalScore",
      "timeTakenSeconds",
      "confidence",
      "reasoning"
    ].join(",") + "\n";

  fs.writeFileSync(csvPath, header, "utf8");
  console.log("✅ CSV header created");
} else {
  console.log("✅ CSV file already exists");
}

// Simple health check to test server is up
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Receive one round from the game
app.post("/comments", (req, res) => {
  // Log that we got a request
  console.log("📥 Got /comments request with body:", {
    participantId: req.body?.participantId,
    difficulty: req.body?.difficulty,
    scenarioId: req.body?.scenarioId,
    totalScore: req.body?.totalScore,
  });

  const {
    participantId,
    difficulty,
    scenarioId,
    scenarioContext,
    scenarioMessage,
    aiType,
    selectedTacticId,
    selectedTacticName,
    correctTacticId,
    correctTacticName,
    correct,
    baseScore,
    timeBonus,
    reasoningBonus,
    streakBonus,
    totalScore,
    timeTakenSeconds,
    confidence,
    reasoning
  } = req.body || {};

  const timestamp = new Date().toISOString();

  const row =
    [
      timestamp,
      csvSafe(participantId),
      csvSafe(difficulty),
      csvSafe(scenarioId),
      csvSafe(scenarioContext),
      csvSafe(scenarioMessage),
      csvSafe(aiType),
      csvSafe(selectedTacticId),
      csvSafe(selectedTacticName),
      csvSafe(correctTacticId),
      csvSafe(correctTacticName),
      correct,
      baseScore ?? 0,
      timeBonus ?? 0,
      reasoningBonus ?? 0,
      streakBonus ?? 0,
      totalScore ?? 0,
      timeTakenSeconds ?? 0,
      confidence ?? "",
      csvSafe(reasoning ?? "")
    ].join(",") + "\n";

  // Try to add one line to the CSV
  fs.appendFile(csvPath, row, (err) => {
    if (err) {
      console.error("❌ Error writing CSV:", err);
      return res.status(500).json({ message: "Failed to save comment" });
    }
    console.log("✅ Saved one CSV row for:", {
      participantId,
      scenarioId,
      difficulty,
      totalScore,
    });
    return res.status(201).json({ message: "Comment saved" });
  });
});

// Download CSV for analysis
app.get("/download-comments", (req, res) => {
  console.log("📤 /download-comments requested");
  if (!fs.existsSync(csvPath)) {
    console.log("⚠️ No CSV file yet");
    return res.status(404).send("No comments yet.");
  }

  res.download(csvPath, "comments.csv", (err) => {
    if (err && !res.headersSent) {
      console.error("❌ Error sending CSV:", err);
      res.status(500).send("Failed to download comments");
    } else if (!err) {
      console.log("✅ CSV download sent");
    }
  });
});

app.listen(PORT, () => {
  console.log(`🟢 Comment server running on port ${PORT}`);
});
