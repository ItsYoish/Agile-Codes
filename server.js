const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files
app.use(express.static(__dirname));

// API endpoint to save database
app.post('/api/save-db', (req, res) => {
  try {
    const data = req.body;
    fs.writeFileSync(path.join(__dirname, 'data', 'db.json'), JSON.stringify(data, null, 2));
    res.json({ success: true, message: 'Database saved successfully' });
  } catch (error) {
    console.error('Error saving database:', error);
    res.status(500).json({ success: false, message: 'Failed to save database', error: error.message });
  }
});

// Serve index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} to access the application`);
});
