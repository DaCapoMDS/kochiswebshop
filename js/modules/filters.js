// Filter and sort settings
let currentFilters = {
    category: 'all',
    priceRange: 'all',
    location: 'all',
    sort: 'relevance'
};

function applyPriceFilter(product, priceRange) {
    const price = product.price;
    switch(priceRange) {
        case 'all': return true;
        case '0-20': return price <= 20;
        case '20-50': return price > 20 && price <= 50;
        case '50-100': return price > 50 && price <= 100;
        case '100+': return price > 100;
        case 'custom':
            const minPrice = parseFloat(document.getElementById('minPrice').value) || 0;
            const maxPrice = parseFloat(document.getElementById('maxPrice').value) || Infinity;
            return price >= minPrice && price <= maxPrice;
        default: return true;
    }
}

function sortProducts(products, sortOrder) {
    const sortedProducts = [...products];
    switch(sortOrder) {
        case 'priceAsc':
            return sortedProducts.sort((a, b) => a.price - b.price);
        case 'priceDesc':
            return sortedProducts.sort((a, b) => b.price - a.price);
        case 'nameAsc':
            return sortedProducts.sort((a, b) => a.name.localeCompare(b.name));
        case 'nameDesc':
            return sortedProducts.sort((a, b) => b.name.localeCompare(a.name));
        default: // relevance
            return sortedProducts;
    }
}

function initializeFilters(onFilterChange) {
    // Event listeners for filters
    document.querySelectorAll('input[name="priceRange"]').forEach(input => {
        input.addEventListener('change', function() {
            currentFilters.priceRange = this.value;
            if (this.value === 'custom') {
                document.getElementById('customPriceRange').style.display = 'block';
            } else {
                document.getElementById('customPriceRange').style.display = 'none';
                onFilterChange();
            }
        });
    });

    document.querySelectorAll('input[name="location"]').forEach(input => {
        input.addEventListener('change', function() {
            currentFilters.location = this.value;
            onFilterChange();
        });
    });

    document.querySelectorAll('input[name="category"]').forEach(input => {
        input.addEventListener('change', function() {
            currentFilters.category = this.value;
            onFilterChange(this.value);
        });
    });

    document.getElementById('sortOrder').addEventListener('change', function() {
        currentFilters.sort = this.value;
        onFilterChange();
    });

    // Custom price range handler
    document.querySelector('#customPriceRange button').addEventListener('click', onFilterChange);
}

export { currentFilters, applyPriceFilter, sortProducts, initializeFilters };