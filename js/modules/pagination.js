function updatePagination(totalPages, currentPage, onPageChange) {
    const pagination = document.getElementById('pagination');
    if (!pagination || totalPages < 1) return;

    let html = '';
    
    // Previous button
    html += `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="return false;" aria-label="Previous">&laquo;</a>
        </li>
    `;
    
    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        html += `
            <li class="page-item ${currentPage === i ? 'active' : ''}">
                <a class="page-link" href="#" onclick="return false;">${i}</a>
            </li>
        `;
    }
    
    // Next button
    html += `
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="return false;" aria-label="Next">&raquo;</a>
        </li>
    `;
    
    pagination.innerHTML = html;

    // Add click handlers
    pagination.querySelectorAll('.page-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            if (link.getAttribute('aria-label') === 'Previous' && currentPage > 1) {
                onPageChange(currentPage - 1);
            } else if (link.getAttribute('aria-label') === 'Next' && currentPage < totalPages) {
                onPageChange(currentPage + 1);
            } else {
                const pageNum = parseInt(link.textContent);
                if (!isNaN(pageNum) && pageNum !== currentPage) {
                    onPageChange(pageNum);
                }
            }
        });
    });
}

function scrollToTop() {
    const productGrid = document.getElementById('productGrid');
    if (productGrid) {
        productGrid.scrollIntoView({ behavior: 'smooth' });
    }
}

export { updatePagination, scrollToTop };