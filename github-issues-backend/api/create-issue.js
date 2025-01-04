const fetch = require('node-fetch');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', 'https://dacapomds.github.io');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, HEAD');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

  // Handle preflight and HEAD requests
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  // Log request and environment details
  console.log('Environment check:', {
    hasToken: !!process.env.GITHUB_API_TOKEN,
    tokenStart: process.env.GITHUB_API_TOKEN ? process.env.GITHUB_API_TOKEN.substring(0, 4) : 'none'
  });

  // Verify GitHub token is configured
  if (!process.env.GITHUB_API_TOKEN) {
    console.error('GitHub token not found in environment');
    return res.status(500).json({
      error: 'Server configuration error',
      details: 'GitHub token not configured'
    });
  }

  // Handle HEAD requests after token verification
  if (req.method === 'HEAD') {
    // For HEAD requests, just verify we can connect to GitHub API
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
        res.status(response.status).end();
      }
    } catch (error) {
      res.status(500).end();
    }
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed',
      details: 'Only POST requests are supported'
    });
  }

  const { title, body } = req.body || {};

  if (!title || !body) {
    return res.status(400).json({
      error: 'Bad request',
      details: 'Title and body are required'
    });
  }

  try {
    console.log('Creating GitHub issue:', { title });
    
    const response = await fetch('https://api.github.com/repos/DaCapoMDS/Webshop_PATtest/issues', {
      method: 'POST',
      headers: {
        'Authorization': `token ${process.env.GITHUB_API_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'KochiWebshop'
      },
      body: JSON.stringify({ title, body })
    });

    const responseText = await response.text();
    console.log('GitHub API response:', {
      status: response.status,
      body: responseText
    });

    if (response.ok) {
      const issue = JSON.parse(responseText);
      return res.status(201).json({
        message: 'Issue created successfully',
        issue_url: issue.html_url,
        issue
      });
    } else {
      return res.status(response.status).json({
        error: 'GitHub API error',
        details: responseText
      });
    }
  } catch (error) {
    console.error('Error creating issue:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
};