const fetch = require('node-fetch');

module.exports = async (req, res) => {
  // Log request details for debugging
  console.log('Request Method:', req.method);
  console.log('Request Headers:', req.headers);
  console.log('Request URL:', req.url);
  console.log('Vercel Environment:', process.env.VERCEL_ENV || 'development');
  console.log('Node Environment:', process.env.NODE_ENV);
  console.log('Available Environment Keys:', Object.keys(process.env));

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
        NODE_ENV: process.env.NODE_ENV,
        HAS_GITHUB_TOKEN: !!process.env.GITHUB_API_TOKEN,
        ENV_KEYS: Object.keys(process.env)
      },
      request: {
        method: req.method,
        headers: req.headers,
        url: req.url
      }
    });
  }

  // Verify GitHub token is configured
  if (!process.env.GITHUB_API_TOKEN) {
    console.error('GitHub token not found in environment');
    return res.status(500).json({
      error: 'Server configuration error',
      details: 'GitHub token not configured',
      environment: process.env.VERCEL_ENV || 'development',
      envKeys: Object.keys(process.env)
    });
  }

  // Allow GET requests for debugging
  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'API endpoint reached',
      tokenStatus: {
        exists: !!process.env.GITHUB_API_TOKEN,
        scopes: process.env.GITHUB_API_TOKEN ? 'Present but redacted' : 'Not present'
      },
      environment: {
        VERCEL_ENV: process.env.VERCEL_ENV,
        NODE_ENV: process.env.NODE_ENV,
        ENV_KEYS: Object.keys(process.env)
      }
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
    // Create GitHub issue for the order
    const response = await fetch('https://api.github.com/repos/DaCapoMDS/Webshop_PATtest/issues', {
      method: 'POST',
      headers: {
        'Authorization': `token ${process.env.GITHUB_API_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'User-Agent': 'KochiWebshop'
      },
      body: JSON.stringify({
        title: `Order #${new Date().getTime()}`,
        body: JSON.stringify(orderData, null, 2),
        labels: ['order']
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('GitHub API Error:', errorData);
      return res.status(response.status).json({
        error: 'GitHub API error',
        details: errorData
      });
    }

    const issue = await response.json();

    return res.status(201).json({
      message: 'Order created successfully',
      order: {
        id: issue.number,
        url: issue.html_url,
        status: 'created'
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