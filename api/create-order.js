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

// Private repository for orders
const REPO_OWNER = 'DaCapoMDS';
const REPO_NAME = 'kochis-orders'; // Private repo for orders
const ORDERS_BRANCH = 'main';

// Validate order data against schema
function validateOrder(data) {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Order data must be an object' };
  }

  // Check for order object
  if (!data.order || typeof data.order !== 'object') {
    return { valid: false, error: 'Missing order details' };
  }

  // Check required fields in order
  if (!Array.isArray(data.order.items) || data.order.items.length === 0) {
    return { valid: false, error: 'Order must contain at least one item' };
  }

  if (typeof data.order.total !== 'number' || data.order.total < 0) {
    return { valid: false, error: 'Invalid total amount' };
  }

  return { valid: true };
}

// Check if repository exists and is accessible
async function checkRepository(octokit) {
  try {
    await octokit.repos.get({
      owner: REPO_OWNER,
      repo: REPO_NAME
    });
    return true;
  } catch (error) {
    if (error.status === 404) {
      return false;
    }
    throw error;
  }
}

// Create repository if it doesn't exist
async function ensureRepository(octokit) {
  const exists = await checkRepository(octokit);
  if (!exists) {
    try {
      await octokit.repos.createForAuthenticatedUser({
        name: REPO_NAME,
        private: true,
        description: 'Private repository for Kochi\'s Webshop orders',
        auto_init: true
      });

      // Initialize counter file
      await octokit.repos.createOrUpdateFileContents({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        path: 'counter.txt',
        message: 'Initialize order counter',
        content: Buffer.from('0').toString('base64'),
        branch: ORDERS_BRANCH
      });
    } catch (error) {
      console.error('Error creating repository:', error);
      throw error;
    }
  }
}

// Get current counter value
async function getCurrentCounter(octokit) {
  try {
    await ensureRepository(octokit);

    const { data } = await octokit.repos.getContent({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path: 'counter.txt',
      ref: ORDERS_BRANCH
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
      path: 'counter.txt',
      ref: ORDERS_BRANCH
    });

    // Update the file
    await octokit.repos.createOrUpdateFileContents({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path: 'counter.txt',
      message: `Update order counter to ${newCounter}`,
      content: Buffer.from(newCounter.toString()).toString('base64'),
      sha: currentFile.sha,
      branch: ORDERS_BRANCH
    });

    return newCounter;
  } catch (error) {
    console.error('Error updating counter:', error);
    throw error;
  }
}

// Save order to repository
async function saveOrder(octokit, orderData) {
  await ensureRepository(octokit);
  
  const currentCounter = await getCurrentCounter(octokit);
  const orderNumber = currentCounter + 1;
  
  const order = {
    id: orderNumber,
    timestamp: new Date().toISOString(),
    status: 'pending',
    ...orderData
  };

  try {
    // Create order file in a year/month structure for better organization
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const orderPath = `orders/${year}/${month}/order_${orderNumber}.json`;

    // Create year/month directory structure if needed
    try {
      await octokit.repos.getContent({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        path: `orders/${year}/${month}`,
        ref: ORDERS_BRANCH
      });
    } catch (error) {
      if (error.status === 404) {
        // Create directory structure by creating a .gitkeep file
        await octokit.repos.createOrUpdateFileContents({
          owner: REPO_OWNER,
          repo: REPO_NAME,
          path: `orders/${year}/${month}/.gitkeep`,
          message: `Create directory structure for ${year}/${month}`,
          content: Buffer.from('').toString('base64'),
          branch: ORDERS_BRANCH
        });
      }
    }

    // Save order file
    await octokit.repos.createOrUpdateFileContents({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path: orderPath,
      message: `Create order ${orderNumber}`,
      content: Buffer.from(JSON.stringify(order, null, 2)).toString('base64'),
      branch: ORDERS_BRANCH,
      committer: {
        name: 'Order System',
        email: 'orders@kochiswebshop.vercel.app'
      },
      author: {
        name: 'Order System',
        email: 'orders@kochiswebshop.vercel.app'
      }
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

    // Use ORDERS_TOKEN environment variable for private repo access
    const { Octokit } = await import('@octokit/rest');
    const octokit = new Octokit({
      auth: process.env.ORDERS_TOKEN // Use separate token for orders repo
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