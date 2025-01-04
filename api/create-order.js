export const config = {
  runtime: 'edge'
};

export default async function handler(request) {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers
    });
  }

  // Simple response for testing
  if (request.method === 'GET') {
    return new Response(
      JSON.stringify({
        status: 'success',
        message: 'Order API is working',
        timestamp: new Date().toISOString()
      }),
      {
        status: 200,
        headers
      }
    );
  }

  // Only allow POST requests for actual orders
  if (request.method !== 'POST') {
    return new Response(
      JSON.stringify({
        error: 'Method not allowed',
        message: 'Only GET and POST requests are supported'
      }),
      {
        status: 405,
        headers
      }
    );
  }

  // Handle POST request
  const body = await request.json().catch(() => null);
  
  return new Response(
    JSON.stringify({
      message: 'Order endpoint reached',
      method: request.method,
      body: body
    }),
    {
      status: 200,
      headers
    }
  );
}