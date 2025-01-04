// Order validation schema
const orderSchema = {
  required: ['total', 'items'],
  properties: {
    total: { type: 'number', minimum: 0 },
    items: { type: 'array', minItems: 1 }
  }
};

const REPO_OWNER = 'DaCapoMDS';
const REPO_NAME = 'kochiswebshop';
const BRANCH = 'main';

// Validate order data against schema
function validateOrder(data) {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Order data must be an object' };
  }

  // Check required fields
  for (const field of orderSchema.required) {
    if (!(field in data)) {
      return { valid: false, error: `Missing required field: ${field}` };
    }
  }

  // Validate total
  if (typeof data.total !== 'number' || data.total < 0) {
    return { valid: false, error: 'Invalid total amount' };
  }

  // Validate items
  if (!Array.isArray(data.items) || data.items.length === 0) {
    return { valid: false, error: 'Order must contain at least one item' };
  }

  return { valid: true };
}

// Get current counter value
async function getCurrentCounter(octokit) {
  try {
    const { data } = await octokit.repos.getContent({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path: 'orders/counter.txt',
      ref: BRANCH
    });

    const content = Buffer.from(data.content, 'base64').toString();
    return parseInt(content.trim()) || 0;
  } catch (error) {
    console.error('Error reading counter:', error);
    return 0;
  }
}

// Update counter in repository
async function updateCounter(octokit, currentCounter) {
  const newCounter = currentCounter + 1;
  
  try {
    // Get current file to get its SHA
    const { data: currentFile } = await octokit.repos.getContent({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path: 'orders/counter.txt',
      ref: BRANCH
    });

    // Update the file
    await octokit.repos.createOrUpdateFileContents({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path: 'orders/counter.txt',
      message: `Update order counter to ${newCounter}`,
      content: Buffer.from(newCounter.toString()).toString('base64'),
      sha: currentFile.sha,
      branch: BRANCH
    });

    return newCounter;
  } catch (error) {
    console.error('Error updating counter:', error);
    throw error;
  }
}

// Save order to repository
async function saveOrder(octokit, orderData) {
  const currentCounter = await getCurrentCounter(octokit);
  const orderNumber = currentCounter + 1;
  
  const order = {
    id: orderNumber,
    timestamp: new Date().toISOString(),
    status: 'pending',
    ...orderData
  };

  try {
    // Create order file
    await octokit.repos.createOrUpdateFileContents({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path: `orders/order_${orderNumber}.json`,
      message: `Create order ${orderNumber}`,
      content: Buffer.from(JSON.stringify(order, null, 2)).toString('base64'),
      branch: BRANCH
    });

    // Update counter
    await updateCounter(octokit, currentCounter);

    return order;
  } catch (error) {
    console.error('Error saving order:', error);
    throw error;
  }
}

module.exports = async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  // Handle GET requests for connection testing
  if (req.method === 'GET') {
    return res.json({
      status: 'success',
      message: 'Order system is ready',
      environment: process.env.VERCEL_ENV || 'development',
      timestamp: new Date().toISOString()
    });
  }

  // Only allow POST requests for actual orders
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed',
      details: 'Only GET and POST requests are supported'
    });
  }

  if (!req.body) {
    return res.status(400).json({
      error: 'Bad request',
      details: 'Order data is required'
    });
  }

  try {
    // Validate order data
    const validation = validateOrder(req.body);
    if (!validation.valid) {
      return res.status(422).json({
        error: 'Invalid order data',
        details: validation.error
      });
    }

    // Dynamically import Octokit
    const { Octokit } = await import('@octokit/rest');
    const octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN
    });

    // Save order to repository
    const savedOrder = await saveOrder(octokit, req.body);

    return res.status(201).json({
      message: 'Order created successfully',
      order: {
        id: savedOrder.id,
        timestamp: savedOrder.timestamp,
        status: savedOrder.status
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