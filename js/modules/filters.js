// Filter and sort settings
const currentFilters = {
    category: 'all',
    priceRange: 'all',
    sort: 'relevance'
};

function applyPriceFilter(product, priceRange) {
    if (priceRange === 'all') return true;
    
    const price = product.price;
    switch(priceRange) {
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
    // Price range filters
    document.querySelectorAll('input[name="priceRange"]').forEach(input => {
        input.addEventListener('change', function() {
            currentFilters.priceRange = this.value;
            const customRange = document.getElementById('customPriceRange');
            if (customRange) {
                customRange.style.display = this.value === 'custom' ? 'block' : 'none';
            }
            if (this.value !== 'custom') {
                onFilterChange();
            }
        });
    });

    // Category filters
    document.querySelectorAll('input[name="category"]').forEach(input => {
        input.addEventListener('change', function() {
            currentFilters.category = this.value;
            onFilterChange(this.value);
        });
    });

    // Sort order
    const sortOrder = document.getElementById('sortOrder');
    if (sortOrder) {
        sortOrder.addEventListener('change', function() {
            currentFilters.sort = this.value;
            onFilterChange();
        });
    }

    // Custom price range
    const customRangeButton = document.querySelector('#customPriceRange button');
    if (customRangeButton) {
        customRangeButton.addEventListener('click', onFilterChange);
    }
}

export { currentFilters, applyPriceFilter, sortProducts, initializeFilters };