export default function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Log request details for debugging
  console.log('Request Method:', req.method);
  console.log('Request Headers:', req.headers);
  console.log('Request URL:', req.url);

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  // Simple response for testing
  if (req.method === 'GET') {
    res.status(200).json({
      status: 'success',
      message: 'Order API is working',
      timestamp: new Date().toISOString()
    });
    return;
  }

  // Only allow POST requests for actual orders
  if (req.method !== 'POST') {
    res.status(405).json({
      error: 'Method not allowed',
      message: 'Only GET and POST requests are supported'
    });
    return;
  }

  // Handle POST request
  res.status(200).json({
    message: 'Order endpoint reached',
    method: req.method,
    body: req.body || null
  });
}