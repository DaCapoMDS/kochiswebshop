export class Cart {
    constructor() {
        this.items = JSON.parse(localStorage.getItem('cart')) || [];
        this.refresh();
    }

    addItem(product) {
        const existingItem = this.items.find(item => item.id === product.id);
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            this.items.push({
                ...product,
                quantity: 1
            });
        }
        this.refresh();
    }

    removeItem(productId) {
        this.items = this.items.filter(item => item.id !== productId);
        this.refresh();
    }

    updateQuantity(productId, quantity) {
        const newQuantity = parseInt(quantity);
        if (isNaN(newQuantity) || newQuantity < 0) return;

        const item = this.items.find(item => item.id === productId);
        if (!item) return;

        if (newQuantity === 0) {
            this.removeItem(productId);
        } else {
            item.quantity = newQuantity;
            this.refresh();
        }
    }

    getTotal() {
        return this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    }

    refresh() {
        this.saveCart();
        this.updateCartCount();
        this.updateCartUI();
    }

    saveCart() {
        localStorage.setItem('cart', JSON.stringify(this.items));
    }

    updateCartCount() {
        const count = this.items.reduce((total, item) => total + item.quantity, 0);
        const cartCountElement = document.getElementById('cartCount');
        if (cartCountElement) {
            cartCountElement.textContent = count;
            cartCountElement.style.display = count > 0 ? 'inline' : 'none';
        }
    }

    updateCartUI() {
        const cartItemsElement = document.getElementById('cartItems');
        const cartTotalElement = document.getElementById('cartTotal');
        
        if (cartItemsElement) {
            cartItemsElement.innerHTML = this.items.map(item => `
                <div class="cart-item" data-id="${item.id}">
                    <div class="cart-item-details">
                        <h6>${item.name}</h6>
                        <p class="text-muted">$${item.price}</p>
                    </div>
                    <div class="cart-item-quantity">
                        <button class="btn btn-sm btn-outline-secondary" onclick="window.cart.updateQuantity(${item.id}, ${item.quantity - 1})">-</button>
                        <span class="mx-2">${item.quantity}</span>
                        <button class="btn btn-sm btn-outline-secondary" onclick="window.cart.updateQuantity(${item.id}, ${item.quantity + 1})">+</button>
                    </div>
                    <button class="btn btn-sm btn-danger" onclick="window.cart.removeItem(${item.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `).join('');
        }

        if (cartTotalElement) {
            cartTotalElement.textContent = `$${this.getTotal().toFixed(2)}`;
        }
    }
}
