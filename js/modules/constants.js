// API endpoints
const VERCEL_API_URL = 'https://kochiswebshop-git-main-dacapos-projects.vercel.app';

export const API_ENDPOINTS = {
    ORDERS_API: `${VERCEL_API_URL}/api/create-order`
};

// Order status constants
export const ORDER_STATUS = {
    PENDING: 'pending',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled'
};

// Error messages
export const ERROR_MESSAGES = {
    CONNECTION_ERROR: 'Cannot connect to order system. Please check your internet connection.',
    RATE_LIMIT: 'Order system is busy. Please try again in {minutes} minutes.',
    SYSTEM_UNAVAILABLE: 'Order system is currently unavailable. Please try again later.',
    INVALID_ORDER: 'Invalid order data. Please check your order and try again.',
    SYSTEM_ERROR: 'An error occurred while processing your order. Please try again.'
};