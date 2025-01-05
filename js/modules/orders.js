import { API_ENDPOINTS, ORDER_STATUS, ERROR_MESSAGES } from './constants.js';

export class OrderManager {
    constructor() {
        // Store only current order in localStorage for customer reference
        this.currentOrder = null;

        // Constants for retry logic
        this.MAX_RETRIES = 3;
        this.RETRY_DELAY = 2000; // 2 seconds
    }

    async createTestOrder(apiData) {
        console.log('Creating test order...');
        const testOrder = {
            items: [
                {
                    id: 'TEST-001',
                    name: 'Test Product',
                    price: 9.99,
                    quantity: 1
                }
            ],
            total: 9.99,
            testOrder: true
        };

        try {
            const orderResult = await this.createOrder(testOrder);
            console.log('Test order created successfully:', orderResult);
            return { success: true, order: orderResult };
        } catch (error) {
            console.error('Failed to create test order:', error);
            return {
                success: false,
                message: 'API is online but test order creation failed',
                details: error.message,
                environment: apiData.environment,
                timestamp: apiData.timestamp
            };
        }
    }

    async checkOrderSystemConnection() {
        try {
            console.log('Checking Vercel API connection...');
            
            const response = await fetch(API_ENDPOINTS.ORDERS_API, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });

            const data = await response.json();

            if (!response.ok) {
                console.error('Vercel API check failed:', response.status);
                return {
                    success: false,
                    message: ERROR_MESSAGES.SYSTEM_UNAVAILABLE,
                    details: data.error || 'Unknown error'
                };
            }

            // Verify we got the expected response format
            if (!data.status || !data.environment || !data.timestamp) {
                console.error('Invalid API response format:', data);
                return {
                    success: false,
                    message: ERROR_MESSAGES.SYSTEM_ERROR,
                    details: 'Invalid API response format'
                };
            }

            console.log('Vercel API check successful:', {
                environment: data.environment,
                timestamp: data.timestamp
            });

            // If in development, create a test order
            if (data.environment === 'development') {
                const testResult = await this.createTestOrder(data);
                if (!testResult.success) {
                    return testResult;
                }
            }

            return {
                success: true,
                message: data.message,
                environment: data.environment,
                timestamp: data.timestamp
            };
        } catch (error) {
            console.error('Error checking Vercel API connection:', error);
            return {
                success: false,
                message: ERROR_MESSAGES.CONNECTION_ERROR,
                details: error.message
            };
        }
    }

    async createOrder(orderData, retryCount = 0) {
        // Skip connection check for test orders to avoid infinite loop
        if (!orderData.testOrder) {
            const connectionCheck = await this.checkOrderSystemConnection();
            if (!connectionCheck.success) {
                throw new Error(connectionCheck.message);
            }
        }

        const order = {
            ...orderData,
            status: ORDER_STATUS.PENDING,
            createdAt: new Date().toISOString()
        };

        try {
            console.log('Creating order...');
            
            const response = await fetch(
                API_ENDPOINTS.ORDERS_API,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(order)
                }
            );

            console.log('Create order response:', {
                status: response.status,
                statusText: response.statusText
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Full error response:', errorData);
                
                const errorMap = {
                    404: ERROR_MESSAGES.SYSTEM_UNAVAILABLE,
                    422: ERROR_MESSAGES.INVALID_ORDER
                };
                const errorMessage = errorMap[response.status] || ERROR_MESSAGES.SYSTEM_ERROR;
                
                console.error('Order creation failed:', {
                    status: response.status,
                    statusText: response.statusText,
                    error: errorData
                });
                
                // Handle server errors with retries
                if ([500, 502, 503, 504].includes(response.status) && retryCount < this.MAX_RETRIES) {
                    console.log(`Server error, retrying in ${this.RETRY_DELAY}ms... (Attempt ${retryCount + 1}/${this.MAX_RETRIES})`);
                    await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY));
                    return this.createOrder(orderData, retryCount + 1);
                }

                throw new Error(errorMessage);
            }

            const responseData = await response.json();
            console.log('Order created successfully:', responseData);
            
            // Store order info for customer reference
            this.currentOrder = {
                id: responseData.order.id,
                timestamp: responseData.order.timestamp,
                status: responseData.order.status,
                total: orderData.total,
                message: 'Your order has been created and is being processed.'
            };
            localStorage.setItem('currentOrder', JSON.stringify(this.currentOrder));
            
            console.log(`Order ${this.currentOrder.id} created successfully`);
            return this.currentOrder;
        } catch (error) {
            console.error('Error saving order:', error);
            throw error;
        }
    }

    getCurrentOrder() {
        if (!this.currentOrder) {
            const stored = localStorage.getItem('currentOrder');
            if (stored) {
                this.currentOrder = JSON.parse(stored);
            }
        }
        return this.currentOrder;
    }

    clearCurrentOrder() {
        this.currentOrder = null;
        localStorage.removeItem('currentOrder');
    }
}