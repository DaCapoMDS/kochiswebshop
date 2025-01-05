const REPO_OWNER = 'DaCapoMDS';
const REPO_NAME = 'kochis-orders';
const ORDERS_BRANCH = 'main';
const COMMITTER = {
    name: 'Order System',
    email: 'orders@kochiswebshop.vercel.app'
};

function validateOrder(data) {
    if (!data?.order) {
        return { valid: false, error: 'Missing order details' };
    }

    const { order } = data;
    const errors = [];

    if (!Array.isArray(order.items) || order.items.length === 0) {
        errors.push('Order must contain at least one item');
    }
    if (typeof order.total !== 'number' || order.total < 0) {
        errors.push('Invalid total amount');
    }

    return errors.length > 0
        ? { valid: false, error: errors.join(', ') }
        : { valid: true };
}

async function manageOrderCounter(octokit) {
    const path = 'counter.txt';

    try {
        // Try to get existing counter
        const { data } = await octokit.repos.getContent({
            owner: REPO_OWNER,
            repo: REPO_NAME,
            path,
            ref: ORDERS_BRANCH
        });

        const currentCounter = parseInt(Buffer.from(data.content, 'base64').toString().trim()) || 0;
        const newCounter = currentCounter + 1;

        await octokit.repos.createOrUpdateFileContents({
            owner: REPO_OWNER,
            repo: REPO_NAME,
            path,
            message: `Update order counter to ${newCounter}`,
            content: Buffer.from(newCounter.toString()).toString('base64'),
            sha: data.sha,
            branch: ORDERS_BRANCH,
            committer: COMMITTER,
            author: COMMITTER
        });

        return newCounter;
    } catch (error) {
        // Create counter file if it doesn't exist
        if (error.status === 404) {
            await octokit.repos.createOrUpdateFileContents({
                owner: REPO_OWNER,
                repo: REPO_NAME,
                path,
                message: 'Initialize order counter',
                content: Buffer.from('1').toString('base64'),
                branch: ORDERS_BRANCH,
                committer: COMMITTER,
                author: COMMITTER
            });
            return 1;
        }
        throw error;
    }
}

async function saveOrder(octokit, orderData) {
    const orderNumber = await manageOrderCounter(octokit);
    const order = {
        id: orderNumber,
        timestamp: new Date().toISOString(),
        status: 'pending',
        ...orderData
    };

    await octokit.repos.createOrUpdateFileContents({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        path: `orders/order_${orderNumber}.json`,
        message: `Create order ${orderNumber}`,
        content: Buffer.from(JSON.stringify(order, null, 2)).toString('base64'),
        branch: ORDERS_BRANCH,
        committer: COMMITTER,
        author: COMMITTER
    });

    return order;
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

    // Handle POST requests for orders
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
        const validation = validateOrder(req.body);
        if (!validation.valid) {
            return res.status(422).json({
                error: 'Invalid order data',
                details: validation.error
            });
        }

        const { Octokit } = await import('@octokit/rest');
        const octokit = new Octokit({ auth: process.env.ORDERS_TOKEN });
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