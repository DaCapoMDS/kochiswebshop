const fs = require('fs').promises;
const path = require('path');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Log request details for debugging
  console.log('Request Method:', req.method);
  console.log('Request Headers:', req.headers);
  console.log('Request URL:', req.url);
  console.log('Vercel Environment:', process.env.VERCEL_ENV || 'development');
  console.log('Node Environment:', process.env.NODE_ENV);

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  // Add debug endpoint
  if (req.url.endsWith('/debug')) {
    return res.status(200).json({
      message: 'Debug endpoint reached',
      environment: {
        VERCEL_ENV: process.env.VERCEL_ENV,
        NODE_ENV: process.env.NODE_ENV
      },
      request: {
        method: req.method,
        headers: req.headers,
        url: req.url
      }
    });
  }

  // Allow GET requests for connection testing
  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'success',
      message: 'Order system is ready',
      environment: process.env.VERCEL_ENV || 'development'
    });
  }

  // Only allow POST requests for actual orders
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed',
      details: 'Only GET and POST requests are supported'
    });
  }

  const orderData = req.body;
  if (!orderData) {
    return res.status(400).json({
      error: 'Bad request',
      details: 'Order data is required'
    });
  }

  try {
    // Define paths for order storage
    const ordersDir = path.join(process.cwd(), 'orders');
    const counterPath = path.join(ordersDir, 'counter.txt');

    // Ensure orders directory exists
    await fs.mkdir(ordersDir, { recursive: true });

    // Read or initialize counter
    let counter;
    try {
      counter = parseInt(await fs.readFile(counterPath, 'utf8')) || 0;
    } catch (error) {
      counter = 0;
    }

    // Increment counter
    counter++;

    // Save new counter value
    await fs.writeFile(counterPath, counter.toString());

    // Create order file
    const orderPath = path.join(ordersDir, `order_${counter}.json`);
    const orderContent = {
      id: counter,
      timestamp: new Date().toISOString(),
      status: 'pending',
      ...orderData
    };

    await fs.writeFile(orderPath, JSON.stringify(orderContent, null, 2));

    return res.status(201).json({
      message: 'Order created successfully',
      order: {
        id: counter,
        timestamp: orderContent.timestamp,
        status: orderContent.status
      }
    });

  } catch (error) {
    console.error('Error processing order:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
};