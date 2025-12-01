const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;  // ✅ FIXED

app.use(cors());
app.use(express.json());

const csvPath = path.join(__dirname, 'comments.csv');

if (!fs.existsSync(csvPath)) {
  fs.writeFileSync(
    csvPath,
    'timestamp,difficulty,scenarioId,correct,score,reasoning\n',
    'utf8'
  );
}

app.post('/comments', (req, res) => {
  const { difficulty, scenarioId, correct, score, reasoning } = req.body || {};

  if (!reasoning || reasoning.trim().length === 0) {
    return res.status(400).json({ message: 'Reasoning is required' });
  }

  const timestamp = new Date().toISOString().replace(/,/g, '');
  const safeReasoning = reasoning.replace(/"/g, '""');

  const row = `"${timestamp}","${difficulty || ''}","${scenarioId || ''}","${correct}","${score || 0}","${safeReasoning}"\n`;

  fs.appendFile(csvPath, row, (err) => {
    if (err) {
      console.error('Error writing to CSV:', err);
      return res.status(500).json({ message: 'Failed to save comment' });
    }
    return res.status(201).json({ message: 'Comment saved' });
  });
});

app.listen(PORT, () => {
  console.log(`Comment server listening on port ${PORT}`);  // ✅ FIXED
});
