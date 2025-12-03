// index.js (Node backend - research-grade logging with confidence + streakBonus)
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

// Make any value safe for CSV
function csvSafe(value) {
  if (value === undefined || value === null) return '""';
  const str = String(value).replace(/"/g, '""');
  return `"${str}"`;
}

// Ensure header exists (and has ALL the columns your frontend sends)
if (!fs.existsSync(csvPath)) {
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
}

// Receive one round from the game
app.post("/comments", (req, res) => {
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

  fs.appendFile(csvPath, row, (err) => {
    if (err) {
      console.error("Error writing CSV:", err);
      return res.status(500).json({ message: "Failed to save comment" });
    }
    return res.status(201).json({ message: "Comment saved" });
  });
});

// Download CSV for analysis
app.get("/download-comments", (req, res) => {
  if (!fs.existsSync(csvPath)) {
    return res.status(404).send("No comments yet.");
  }

  res.download(csvPath, "comments.csv", (err) => {
    if (err && !res.headersSent) {
      console.error("Error sending CSV:", err);
      res.status(500).send("Failed to download comments");
    }
  });
});

app.listen(PORT, () => {
  console.log(`Comment server running on port ${PORT}`);
});
