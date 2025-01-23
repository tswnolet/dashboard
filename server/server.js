
const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const app = express();

// Serve React build
app.use(express.static(path.join(__dirname, 'frontend/build')));

// Catch-all for React Router
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/build', 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MySQL Database Connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'lehzrxmy_WPSGZ',
  password: 'Scorpius123!',
  database: 'lehzrxmy_WPSGZ',
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
  } else {
    console.log('Connected to MySQL database.');
  }
});

app.post('/api/login', (req, res) => {
  const { user, password } = req.body;
  const sql = 'SELECT * FROM users WHERE user = ? AND password = ?';
  db.query(sql, [user, password], (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'Database error', error: err });
    if (results.length > 0) {
      res.json({ success: true, message: 'Login successful', user: results[0] });
    } else {
      res.json({ success: false, message: 'Invalid username or password' });
    }
  });
});

app.post('/api/signup', (req, res) => {
  const { user, password } = req.body;
  const sql = 'INSERT INTO users (user, password) VALUES (?, ?)';
  db.query(sql, [user, password], (err) => {
    if (err) return res.status(500).json({ success: false, message: 'Database error', error: err });
    res.json({ success: true, message: 'Signup successful' });
  });
});

app.get('/api/session', (req, res) => {
  res.json({ isLoggedIn: true });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});