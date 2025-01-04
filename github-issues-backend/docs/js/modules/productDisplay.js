function createProductCard(product) {
    return `
        <div class="col-md-3 product-item" data-category="${product.category}">
            <div class="product-card">
                <div class="product-image">
                    <img src="${product.id === 1 ? './Image/WhatsApp_Image_2024-12-25_at_17.png' : `https://via.placeholder.com/800x600/f5f5f5/999999?text=${product.name}`}" alt="${product.name}" class="img-fluid" onclick="window.location.href='./product.html?id=${product.id}'" style="cursor: pointer;">
                    <button class="favorite-btn"><i class="fas fa-heart"></i></button>
                </div>
                <div class="product-info">
                    <h5 onclick="window.location.href='./product.html?id=${product.id}'" style="cursor: pointer;">${product.name}</h5>
                    <p class="description">${product.description}</p>
                    <p class="price">€${product.price}</p>
                    <div class="d-flex gap-2">
                        <button class="btn btn-primary flex-grow-1" onclick='window.cart.addItem(${JSON.stringify(product).replace(/'/g, "\\'")})'>Add to Cart</button>
                        <button class="btn btn-outline-primary" onclick="window.location.href='./product.html?id=${product.id}'">Details</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Constants
const ITEMS_PER_PAGE = 40;

function displayProducts(products, category = 'all', page = 1, filters) {
    const productGrid = document.getElementById('productGrid');
    
    // Apply all filters
    let filteredProducts = products.filter(product => {
        return (category === 'all' || product.category === category) &&
               filters.applyPriceFilter(product, filters.currentFilters.priceRange);
    });

    // Apply sorting
    filteredProducts = filters.sortProducts(filteredProducts, filters.currentFilters.sort);
    
    // Calculate pagination
    const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    
    // Get current page products
    const currentProducts = filteredProducts.slice(startIndex, endIndex);
    
    // Display products
    productGrid.innerHTML = currentProducts.map(createProductCard).join('');
    
    return totalPages;
}

export { createProductCard, displayProducts, ITEMS_PER_PAGE };