const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
require('dotenv').config();

const app = express();

// Connect to Database
connectDB();

// Init Middleware
app.use(cors({
  origin: [
    'https://aarambh-git-main-vishal-sukhwal-s-projects.vercel.app',
    'https://www.aarambhh.com',
    'http://localhost:5173',
    'http://localhost:3000'
  ],
  credentials: true
}));
app.use(express.json({ extended: false }));

// Define Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/leads', require('./routes/leads'));
app.use('/api/mca', require('./routes/mca'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/quote', require('./routes/quote'));
app.use('/api/categories', require('./routes/categories'));

// Serve uploads in development
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
