// Order validation schema
const orderSchema = {
  required: ['order'],
  properties: {
    order: {
      required: ['items', 'total'],
      properties: {
        items: { type: 'array', minItems: 1 },
        total: { type: 'number', minimum: 0 }
      }
    }
  }
};

const REPO_OWNER = 'DaCapoMDS';
const REPO_NAME = 'kochis-orders';
const ORDERS_BRANCH = 'main';

// Validate order data against schema
function validateOrder(data) {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Order data must be an object' };
  }

  const { order } = data;
  const errors = [];

  // Check against schema
  if (!order) {
    errors.push('Missing order details');
  } else {
    if (!Array.isArray(order.items) || order.items.length === 0) {
      errors.push('Order must contain at least one item');
    }
    if (typeof order.total !== 'number' || order.total < 0) {
      errors.push('Invalid total amount');
    }
  }

  return errors.length > 0
    ? { valid: false, error: errors.join(', ') }
    : { valid: true };
}

// Manage order counter in repository
async function manageOrderCounter(octokit) {
  const path = 'counter.txt';
  const committer = {
    name: 'Order System',
    email: 'orders@kochiswebshop.vercel.app'
  };

  try {
    // Get current counter
    let currentCounter = 0;
    try {
      const { data } = await octokit.repos.getContent({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        path,
        ref: ORDERS_BRANCH
      });
      currentCounter = parseInt(Buffer.from(data.content, 'base64').toString().trim()) || 0;

      // Update counter
      const newCounter = currentCounter + 1;
      await octokit.repos.createOrUpdateFileContents({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        path,
        message: `Update order counter to ${newCounter}`,
        content: Buffer.from(newCounter.toString()).toString('base64'),
        sha: data.sha,
        branch: ORDERS_BRANCH,
        committer,
        author: committer
      });

      return newCounter;
    } catch (error) {
      if (error.status === 404) {
        // Counter file doesn't exist, create it with initial value 1
        await octokit.repos.createOrUpdateFileContents({
          owner: REPO_OWNER,
          repo: REPO_NAME,
          path,
          message: 'Initialize order counter',
          content: Buffer.from('1').toString('base64'),
          branch: ORDERS_BRANCH,
          committer,
          author: committer
        });
        return 1;
      }
      throw error;
    }
  } catch (error) {
    console.error('Error managing counter:', error);
    throw error;
  }
}

// Save order to repository
async function saveOrder(octokit, orderData) {
  try {
    const orderNumber = await manageOrderCounter(octokit);
    
    const order = {
      id: orderNumber,
      timestamp: new Date().toISOString(),
      status: 'pending',
      ...orderData
    };

    const committer = {
      name: 'Order System',
      email: 'orders@kochiswebshop.vercel.app'
    };

    await octokit.repos.createOrUpdateFileContents({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path: `orders/order_${orderNumber}.json`,
      message: `Create order ${orderNumber}`,
      content: Buffer.from(JSON.stringify(order, null, 2)).toString('base64'),
      branch: ORDERS_BRANCH,
      committer,
      author: committer
    });

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

    // Use ORDERS_TOKEN environment variable for private repo access
    const { Octokit } = await import('@octokit/rest');
    const octokit = new Octokit({
      auth: process.env.ORDERS_TOKEN
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