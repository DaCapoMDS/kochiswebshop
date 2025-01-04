module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'GET') {
    res.json({
      status: 'success',
      message: 'API is working',
      timestamp: new Date().toISOString()
    });
    return;
  }

  res.status(405).json({
    error: 'Method not allowed',
    message: 'Only GET requests are supported on this endpoint'
  });
};