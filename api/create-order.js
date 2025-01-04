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
  console.log('Current Working Directory:', process.cwd());

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  // Allow GET requests for connection testing
  if (req.method === 'GET') {
    res.json({
      status: 'success',
      message: 'Order system is ready',
      environment: process.env.VERCEL_ENV || 'development',
      timestamp: new Date().toISOString()
    });
    return;
  }

  // Only allow POST requests for actual orders
  if (req.method !== 'POST') {
    res.status(405).json({
      error: 'Method not allowed',
      details: 'Only GET and POST requests are supported'
    });
    return;
  }

  if (!req.body) {
    res.status(400).json({
      error: 'Bad request',
      details: 'Order data is required'
    });
    return;
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
      ...req.body
    };

    await fs.writeFile(orderPath, JSON.stringify(orderContent, null, 2));

    res.status(201).json({
      message: 'Order created successfully',
      order: {
        id: counter,
        timestamp: orderContent.timestamp,
        status: orderContent.status
      }
    });

  } catch (error) {
    console.error('Error processing order:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
};