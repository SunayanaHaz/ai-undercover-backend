// index.js (Node backend)
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();

// ✅ IMPORTANT for Render: use its PORT if given, or 5000 locally
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Path to the CSV file where we store comments
const csvPath = path.join(__dirname, 'comments.csv');

// If CSV file doesn't exist yet, create it with a header row
if (!fs.existsSync(csvPath)) {
  fs.writeFileSync(
    csvPath,
    'timestamp,difficulty,scenarioId,correct,score,reasoning\n',
    'utf8'
  );
}

// 👉 This is called when the game SENDS a comment (POST /comments)
app.post('/comments', (req, res) => {
  const { difficulty, scenarioId, correct, score, reasoning } = req.body || {};

  // Basic validation: we at least require some reasoning text
  if (!reasoning || reasoning.trim().length === 0) {
    return res.status(400).json({ message: 'Reasoning is required' });
  }

  const timestamp = new Date().toISOString().replace(/,/g, ''); // no commas in timestamp
  const safeReasoning = reasoning.replace(/"/g, '""'); // escape quotes for CSV

  const row = `"${timestamp}","${difficulty || ''}","${scenarioId || ''}","${correct}","${score || 0}","${safeReasoning}"\n`;

  fs.appendFile(csvPath, row, (err) => {
    if (err) {
      console.error('Error writing to CSV:', err);
      return res.status(500).json({ message: 'Failed to save comment' });
    }
    return res.status(201).json({ message: 'Comment saved' });
  });
});

// 👉 NEW: This is called when *you* want to DOWNLOAD all comments (GET /download-comments)
app.get('/download-comments', (req, res) => {
  if (!fs.existsSync(csvPath)) {
    return res.status(404).send('No comments file found yet.');
  }

  // Send the CSV file to the browser as a download
  res.download(csvPath, 'comments.csv', (err) => {
    if (err) {
      console.error('Error sending CSV file:', err);
      if (!res.headersSent) {
        res.status(500).send('Failed to download comments');
      }
    }
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Comment server listening on port ${PORT}`);
});
