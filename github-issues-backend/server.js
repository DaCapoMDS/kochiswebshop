require('dotenv').config();
const express = require('express');
const cors = require('cors');
const createOrder = require('./api/create-order');

const app = express();
const port = process.env.PORT || 3000;

// CORS configuration
app.use(cors({
  origin: 'https://dacapomds.github.io',
  methods: ['GET', 'POST', 'OPTIONS', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Accept', 'Authorization']
}));

// Parse JSON bodies
app.use(express.json());

// Mount the create-order endpoint
app.all('/api/create-order', (req, res) => {
  createOrder(req, res);
});

// Log environment status
console.log('GitHub Token status:', process.env.GITHUB_API_TOKEN ? 'Present' : 'Missing');

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});