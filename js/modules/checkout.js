import { Cart } from './cart.js';
import { OrderManager } from './orders.js';

const SHIPPING_COST = 5.00;
const TAX_RATE = 0.10;

class CheckoutManager {
    constructor() {
        this.cart = new Cart();
        this.orderManager = new OrderManager();
        this.initializeUI();
    }

    calculateTotals() {
        const subtotal = this.cart.getTotal();
        const shipping = SHIPPING_COST;
        const tax = subtotal * TAX_RATE;
        const total = subtotal + shipping + tax;
        return { subtotal, shipping, tax, total };
    }

    updateOrderSummary() {
        const orderItems = document.getElementById('orderItems');
        const { subtotal, shipping, tax, total } = this.calculateTotals();
        
        // Display items
        orderItems.innerHTML = this.cart.items.map(item => `
            <div class="d-flex justify-content-between mb-2">
                <span>${item.name} × ${item.quantity}</span>
                <span>€${(item.price * item.quantity).toFixed(2)}</span>
            </div>
        `).join('');
        
        // Update totals
        document.getElementById('subtotal').textContent = `€${subtotal.toFixed(2)}`;
        document.getElementById('tax').textContent = `€${tax.toFixed(2)}`;
        document.getElementById('total').textContent = `€${total.toFixed(2)}`;
    }

    getFormData() {
        return {
            shipping: {
                firstName: document.getElementById('firstName').value,
                lastName: document.getElementById('lastName').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value,
                address: document.getElementById('address').value,
                country: document.getElementById('country').value,
                state: document.getElementById('state').value,
                zip: document.getElementById('zip').value
            },
            order: {
                items: this.cart.items,
                ...this.calculateTotals()
            }
        };
    }

    async processOrder(paymentMethod, paymentDetails = {}) {
        const form = document.getElementById('checkoutForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        try {
            const formData = {
                ...this.getFormData(),
                payment: {
                    method: paymentMethod,
                    ...paymentDetails
                }
            };

            const order = await this.orderManager.createOrder(formData);
            localStorage.removeItem('cart');
            window.location.href = `./confirmation.html?orderId=${order.id}`;
        } catch (error) {
            console.error(`${paymentMethod} payment failed:`, error);
            alert(`There was an error processing your ${paymentMethod} payment. Please try again.`);
        }
    }

    initializeUI() {
        // Initialize PayPal
        paypal.Buttons({
            createOrder: (data, actions) => {
                const { total } = this.calculateTotals();
                return actions.order.create({
                    purchase_units: [{
                        amount: {
                            value: total.toFixed(2),
                            currency_code: 'EUR'
                        }
                    }]
                });
            },
            onApprove: async (data, actions) => {
                await actions.order.capture();
                await this.processOrder('paypal', { paypalOrderId: data.orderID });
            }
        }).render('#paypal-button-container');

        // Initialize test payment button
        document.getElementById('test-payment-button').addEventListener('click', () => {
            this.processOrder('test_payment', {
                testOrderId: 'test_' + Math.random().toString(36).substr(2, 9)
            });
        });

        // Load initial order summary
        this.updateOrderSummary();
    }
}

// Initialize checkout
const checkout = new CheckoutManager();

// Export for form handling
export function handleSubmit(event) {
    event.preventDefault();
    return false;
}