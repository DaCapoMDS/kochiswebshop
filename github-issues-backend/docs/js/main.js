import { currentFilters, applyPriceFilter, sortProducts, initializeFilters } from './modules/filters.js';
import { displayProducts, ITEMS_PER_PAGE } from './modules/productDisplay.js';
import { updatePagination, scrollToTop } from './modules/pagination.js';
import { products } from './modules/products.js';
import { Cart } from './modules/cart.js';
import { OrderManager } from './modules/orders.js';

console.log('Main module loaded');
console.log('Products loaded:', products);
console.log('Products array length:', products.length);

let currentPage = 1;

// Initialize cart and make it globally available
window.cart = new Cart();
console.log('Cart initialized');

// Initialize order manager and make it globally available
window.orderManager = new OrderManager();
console.log('Order manager initialized');

// Make products globally available for other scripts
window.products = products;

// Add test function for GitHub connection
window.testGitHubConnection = async function() {
    const testBtn = document.querySelector('#test-connection-btn');
    const originalText = testBtn.innerHTML;
    testBtn.disabled = true;
    testBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Testing...';

    try {
        const result = await window.orderManager.checkGitHubConnection();
        console.log('GitHub connection test result:', result);
        
        if (result.success) {
            testBtn.className = 'nav-link btn btn-link text-success';
            testBtn.innerHTML = '<i class="fas fa-check"></i> System Ready';
            setTimeout(() => {
                testBtn.className = 'nav-link btn btn-link';
                testBtn.innerHTML = originalText;
                testBtn.disabled = false;
            }, 3000);
        } else {
            testBtn.className = 'nav-link btn btn-link text-danger';
            testBtn.innerHTML = '<i class="fas fa-times"></i> System Error';
            alert(result.message);
            setTimeout(() => {
                testBtn.className = 'nav-link btn btn-link';
                testBtn.innerHTML = originalText;
                testBtn.disabled = false;
            }, 3000);
        }
    } catch (error) {
        console.error('GitHub connection test failed:', error);
        testBtn.className = 'nav-link btn btn-link text-danger';
        testBtn.innerHTML = '<i class="fas fa-times"></i> System Error';
        alert('Connection test failed: ' + error.message);
        setTimeout(() => {
            testBtn.className = 'nav-link btn btn-link';
            testBtn.innerHTML = originalText;
            testBtn.disabled = false;
        }, 3000);
    }
};

// Add test button to the page
document.addEventListener('DOMContentLoaded', () => {
    const nav = document.querySelector('.navbar-nav');
    if (nav) {
        const li = document.createElement('li');
        li.className = 'nav-item';
        const button = document.createElement('button');
        button.id = 'test-connection-btn';
        button.className = 'nav-link btn btn-link';
        button.innerHTML = '<i class="fas fa-sync"></i> Test Connection';
        button.onclick = window.testGitHubConnection;
        li.appendChild(button);
        nav.appendChild(li);
    }
});

function changePage(page) {
    console.log('Changing to page:', page);
    currentPage = page;
    const totalPages = displayProducts(products, currentFilters.category, currentPage, {
        currentFilters,
        applyPriceFilter,
        sortProducts
    });
    updatePagination(totalPages, currentPage, changePage);
    scrollToTop();
}

function handleFilterChange(category = currentFilters.category) {
    console.log('Filter changed:', { category, currentFilters });
    currentPage = 1;
    const totalPages = displayProducts(products, category, currentPage, {
        currentFilters,
        applyPriceFilter,
        sortProducts
    });
    updatePagination(totalPages, currentPage, changePage);
}

// Initialize everything once the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing application');
    try {
        // Initialize filters with callback
        initializeFilters(handleFilterChange);
        
        // Initial display of products
        handleFilterChange(currentFilters.category);
        console.log('Initial products displayed');
    } catch (error) {
        console.error('Error during initialization:', error);
    }
});

// Checkout function
window.checkout = async function() {
    if (cart.items.length === 0) {
        alert('Your cart is empty!');
        return;
    }

    // Show loading state on checkout button
    const checkoutBtn = document.querySelector('.cart-footer .btn-primary');
    const originalText = checkoutBtn.textContent;
    checkoutBtn.disabled = true;
    checkoutBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Loading...';

    try {
        // Check GitHub connection before proceeding
        const connectionStatus = await window.orderManager.checkGitHubConnection();
        
        if (!connectionStatus.success) {
            throw new Error(connectionStatus.message);
        }

        // If we get here, the validation was successful
        window.location.href = './checkout.html';
    } catch (error) {
        console.error('Order system validation failed:', error);
        alert(error.message || 'Sorry, the order system is temporarily unavailable. Please try again later.');
    } finally {
        // Restore checkout button state
        checkoutBtn.disabled = false;
        checkoutBtn.textContent = originalText;
    }
};

// Add error handler for module loading
window.addEventListener('error', function(e) {
    console.error('Script error:', e);
});

// Add unhandled promise rejection handler
window.addEventListener('unhandledrejection', function(e) {
    console.error('Promise rejection:', e.reason);
});