require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const documentRoutes = require('./src/routes/documentRoutes');
const matchRoutes = require('./src/routes/matchRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/documents', documentRoutes);
app.use('/api/match', matchRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Three-Way Match Engine API', status: 'running' });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/three-way-match')
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
