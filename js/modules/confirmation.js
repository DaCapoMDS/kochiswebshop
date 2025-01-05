import { OrderManager } from './orders.js';

function formatDeliveryDate() {
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 7);
    return deliveryDate.toLocaleDateString();
}

function displayOrderInfo(order) {
    const orderInfo = document.getElementById('orderInfo');
    if (!orderInfo) return;

    orderInfo.innerHTML = `
        <p class="mb-1">Order ID: <strong>${order.id}</strong></p>
        <p class="mb-1">Order Status: <strong>${order.status}</strong></p>
        <p class="mb-1">Total Amount: <strong>€${order.total.toFixed(2)}</strong></p>
        <p>Estimated Delivery: <strong>${formatDeliveryDate()}</strong></p>
    `;
}

// Initialize confirmation page
const orderManager = new OrderManager();
const currentOrder = orderManager.getCurrentOrder();

if (currentOrder) {
    displayOrderInfo(currentOrder);
    orderManager.clearCurrentOrder();
} else {
    window.location.href = './index.html';
}