// index.js (Node backend)
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5000;

// Allow all origins (Netlify frontend calls Render backend)
app.use(cors());
app.use(express.json());

// CSV output file
const csvPath = path.join(__dirname, "comments.csv");

// Ensure CSV header row exists
if (!fs.existsSync(csvPath)) {
  fs.writeFileSync(
    csvPath,
    [
      "timestamp",
      "difficulty",
      "scenarioId",
      "correct",
      "score",
      "timeTakenSeconds",
      "selectedTacticId",
      "correctTacticId",
      "reasoning"
    ].join(",") + "\n",
    "utf8"
  );
}

// Receive data from game
app.post("/comments", (req, res) => {
  const {
    difficulty,
    scenarioId,
    correct,
    score,
    reasoning,
    selectedTacticId,
    correctTacticId,
    timeTakenSeconds
  } = req.body || {};

  if (!reasoning || reasoning.trim().length === 0) {
    return res.status(400).json({ message: "Reasoning is required" });
  }

  const timestamp = new Date().toISOString();
  const safeReasoning = `"${reasoning.replace(/"/g, '""')}"`;

  const row = [
    timestamp,
    difficulty || "",
    scenarioId || "",
    correct,
    score || 0,
    timeTakenSeconds || 0,
    selectedTacticId || "",
    correctTacticId || "",
    safeReasoning
  ].join(",") + "\n";

  fs.appendFile(csvPath, row, (err) => {
    if (err) {
      console.error("Error writing CSV:", err);
      return res.status(500).json({ message: "Failed to save comment" });
    }
    return res.status(201).json({ message: "Comment saved" });
  });
});

// Download CSV as a file
app.get("/download-comments", (req, res) => {
  if (!fs.existsSync(csvPath)) {
    return res.status(404).send("No comments yet.");
  }

  res.download(csvPath, "comments.csv", (err) => {
    if (err && !res.headersSent) {
      res.status(500).send("Failed to download comments");
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Comment server running on port ${PORT}`);
});
