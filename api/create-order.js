import { writeFile, readFile } from 'fs/promises';
import { join } from 'path';

// Order validation schema
const orderSchema = {
  required: ['total', 'items'],
  properties: {
    total: { type: 'number', minimum: 0 },
    items: { type: 'array', minItems: 1 }
  }
};

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

// Get next order number from counter file
async function getNextOrderNumber() {
  try {
    const counterPath = join(process.cwd(), 'orders', 'counter.txt');
    const counter = parseInt(await readFile(counterPath, 'utf8')) || 0;
    await writeFile(counterPath, (counter + 1).toString());
    return counter + 1;
  } catch (error) {
    console.error('Error managing order counter:', error);
    // Fallback to timestamp if counter fails
    return Date.now();
  }
}

// Save order to filesystem
async function saveOrder(orderData) {
  const orderNumber = await getNextOrderNumber();
  const orderPath = join(process.cwd(), 'orders', `order_${orderNumber}.json`);
  
  const order = {
    id: orderNumber,
    timestamp: new Date().toISOString(),
    status: 'pending',
    ...orderData
  };

  await writeFile(orderPath, JSON.stringify(order, null, 2));
  return order;
}

// Using Node.js runtime instead of Edge
export const config = {
  api: {
    bodyParser: true
  }
};

export default async function handler(req, res) {
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

    // Save order to filesystem
    const savedOrder = await saveOrder(req.body);

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
}