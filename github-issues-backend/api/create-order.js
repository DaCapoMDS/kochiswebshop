const fetch = require('node-fetch');

module.exports = async (req, res) => {
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  // Verify GitHub token is configured
  console.log('Environment variables:', process.env);
  console.log('GitHub API Token:', process.env.GITHUB_API_TOKEN);
  
  if (!process.env.GITHUB_API_TOKEN) {
    console.error('GitHub token not found in environment');
    return res.status(500).json({
      error: 'Server configuration error',
      details: 'GitHub token not configured'
    });
  }

  // Handle HEAD requests after token verification
  if (req.method === 'HEAD') {
    try {
      const response = await fetch('https://api.github.com/repos/DaCapoMDS/Webshop_PATtest', {
        method: 'HEAD',
        headers: {
          'Authorization': `token ${process.env.GITHUB_API_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'KochiWebshop'
        }
      });
      
      if (response.ok) {
        res.status(200).end();
      } else {
        console.error('GitHub API check failed:', response.status);
        res.status(response.status).end();
      }
    } catch (error) {
      console.error('GitHub API check error:', error);
      res.status(500).end();
    }
    return;
  }

  // Allow GET requests for debugging
  if (req.method === 'GET') {
    return res.status(200).json({
      environment: process.env,
      githubToken: process.env.GITHUB_API_TOKEN
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
    const fs = require('fs').promises;
    const path = require('path');
    
    // Ensure orders directory exists
    const ordersDir = path.join(__dirname, '../../docs/orders');
    await fs.mkdir(ordersDir, { recursive: true });

    // Read current counter
    const counterPath = path.join(ordersDir, 'counter.txt');
    let currentCounter = 0;
    
    try {
      const counterContent = await fs.readFile(counterPath, 'utf-8');
      currentCounter = parseInt(counterContent) || 0;
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }

    const newCounter = currentCounter + 1;

    // Prepare the order with number
    const order = {
      ...orderData,
      orderNumber: newCounter,
      createdAt: new Date().toISOString()
    };

    // Create the order file
    const orderContent = JSON.stringify(order, null, 2);
    const orderPath = path.join(ordersDir, `order_${newCounter}.json`);
    await fs.writeFile(orderPath, orderContent);

    // Update the counter
    await fs.writeFile(counterPath, newCounter.toString());

    // Return success response

    return res.status(201).json({
      message: 'Order created successfully',
      order: {
        id: order.id,
        orderNumber: newCounter,
        status: order.status
      }
    });

  } catch (error) {
    console.error('Error creating order:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
};