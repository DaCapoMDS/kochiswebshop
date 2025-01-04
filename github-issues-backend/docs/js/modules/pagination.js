function updatePagination(totalPages, currentPage, onPageChange) {
    const pagination = document.getElementById('pagination');
    let paginationHTML = '';
    
    // Previous button
    paginationHTML += `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="return false;" aria-label="Previous">
                <span aria-hidden="true">&laquo;</span>
            </a>
        </li>
    `;
    
    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        paginationHTML += `
            <li class="page-item ${currentPage === i ? 'active' : ''}">
                <a class="page-link" href="#" onclick="return false;">${i}</a>
            </li>
        `;
    }
    
    // Next button
    paginationHTML += `
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="return false;" aria-label="Next">
                <span aria-hidden="true">&raquo;</span>
            </a>
        </li>
    `;
    
    pagination.innerHTML = paginationHTML;

    // Add click event listeners
    const pageLinks = pagination.querySelectorAll('.page-link');
    pageLinks.forEach((link, index) => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            if (link.getAttribute('aria-label') === 'Previous' && currentPage > 1) {
                onPageChange(currentPage - 1);
            } else if (link.getAttribute('aria-label') === 'Next' && currentPage < totalPages) {
                onPageChange(currentPage + 1);
            } else if (!link.getAttribute('aria-label')) {
                // Regular page number
                onPageChange(index);
            }
        });
    });
}

function scrollToTop() {
    document.getElementById('productGrid').scrollIntoView({ behavior: 'smooth' });
}

export { updatePagination, scrollToTop };