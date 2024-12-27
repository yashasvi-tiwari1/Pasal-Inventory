document.addEventListener('DOMContentLoaded', function() {
    // Initialize variables
    let products = [];
    const uploadModal = new bootstrap.Modal(document.getElementById('uploadModal'));

    // Initialize filters
    initializeFilters();

    // Event listeners
    document.getElementById('uploadButton').addEventListener('click', () => uploadModal.show());
    document.getElementById('submitUpload').addEventListener('click', handleFileUpload);
    document.getElementById('searchInput').addEventListener('input', handleSearch);
    document.getElementById('categoryFilter').addEventListener('change', handleSearch);
    document.getElementById('sectionFilter').addEventListener('change', handleSearch);

    function handleFileUpload() {
        const uploadForm = document.getElementById('uploadForm');
        const excelFileInput = document.getElementById('excelFile');
        const formData = new FormData(uploadForm);
        const file = excelFileInput.files[0];

        if (!file) {
            alert('Please select a file to upload.');
            return;
        }

        formData.append('file', file);

        fetch('/upload', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                throw new Error(data.error);
            }
            products = data.products || [];
            if (!Array.isArray(products)) {
                throw new Error('Invalid products data received');
            }
            products.forEach(product => {
                if (!product.quantity) {
                    product.quantity = 0;
                }
            });
            localStorage.setItem('products', JSON.stringify(products));
            renderProducts(products);
            alert(data.message || 'File uploaded successfully');
            fetchCategories();
        })
        .catch(error => {
            console.error('Upload error:', error);
            alert(error.message || 'An error occurred while uploading the file.');
        });
    }

    function handleEdit(productId) {
        const row = document.getElementById(`product-${productId}`);
        if (!row) return;

        const editButton = row.querySelector('.edit-button');
        const updateButton = row.querySelector('.update-button');

        if (editButton && updateButton) {
            editButton.style.display = 'none';
            updateButton.style.display = 'inline-block';
        }

        row.querySelectorAll('[contenteditable]').forEach(el => {
            el.setAttribute('contenteditable', 'true');
        });
    }
    window.handleEdit = handleEdit;

    function handleUpdate(productId) {
        const row = document.getElementById(`product-${productId}`);
        if (!row) {
            console.error('Row not found:', productId);
            return;
        }

        const data = {
            name: row.querySelector('.name').textContent.trim(),
            category: row.querySelector('.category').textContent.trim(),
            section: row.querySelector('.section').textContent.trim(),
            location: row.querySelector('.location').textContent.trim(),
            quantity: parseInt(row.querySelector('.quantity').textContent.trim()) || 0
        };

        fetch(`/product/${productId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(data => Promise.reject(data.error));
            }
            return response.json();
        })
        .then(data => {
            alert(data.message || 'Product updated successfully');
            fetchProducts(); // Refresh the table
        })
        .catch(error => {
            console.error('Update error:', error);
            alert('Failed to update product: ' + error);
        })
        .finally(() => {
            // Reset edit mode
            const editButton = row.querySelector('.edit-button');
            const updateButton = row.querySelector('.update-button');
            if (editButton && updateButton) {
                editButton.style.display = 'inline-block';
                updateButton.style.display = 'none';
            }
            row.querySelectorAll('[contenteditable]').forEach(el => {
                el.setAttribute('contenteditable', 'false');
            });
        });
    }
    window.handleUpdate = handleUpdate;

    function handleDelete(productId) {
        if (!confirm('Are you sure you want to delete this product?')) {
            return;
        }

        fetch(`/product/${productId}`, {
            method: 'DELETE',
            headers: {
                'Accept': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                throw new Error(data.error);
            }
            document.getElementById(`product-${productId}`).remove();
            alert('Product deleted successfully');
        })
        .catch(error => {
            console.error('Delete error:', error);
            alert(error.message || 'Failed to delete product');
        });
    }
    window.handleDelete = handleDelete;

    function handleSearch() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const selectedCategory = document.getElementById('categoryFilter').value;
        const selectedSection = document.getElementById('sectionFilter').value;

        const rows = document.querySelectorAll('tbody tr');

        rows.forEach(row => {
            const name = row.querySelector('.name')?.textContent.toLowerCase() || '';
            const category = row.querySelector('.category')?.textContent || '';
            const section = row.querySelector('.section')?.textContent || '';

            const matchesSearch = name.includes(searchTerm);
            const matchesCategory = !selectedCategory || category === selectedCategory;
            const matchesSection = !selectedSection || section === selectedSection;

            row.style.display = matchesSearch && matchesCategory && matchesSection ? '' : 'none';
        });
    }
  
    async function showAllData() {
        const response = await fetch(`/products`);
        const data = await response.json();
        renderProducts(data.products);
        document.getElementById('pagination').style.display = 'none';
    }
    function changeItemsPerPage(value) { 
        if (value === 'all') {
            showAllData();
        }  
        else {
            const perPage = parseInt(value);
            localStorage.setItem('perPage', perPage);
            fetchProducts(1, perPage);
            document.getElementById('pagination').style.display = 'flex';
        }
    }
    window.changeItemsPerPage = changeItemsPerPage;

    function fetchProducts(page = 1, perPage = 10) {
        fetch(`/products?page=${page}&per_page=${perPage}`)
            .then(response => response.json())
            .then(data => {
                products = data.products;
                products.forEach(product => {
                    if (!product.quantity) {
                        product.quantity = 0;
                    }
                });
                localStorage.setItem('products', JSON.stringify(products));
                renderProducts(products);
                renderPagination(data.pages, data.current_page);
            })
            .catch(error => {
                console.error('Error:', error);
            });
    }

    function renderProducts(products) {
        const productsTable = document.getElementById('productsTable').getElementsByTagName('tbody')[0];
        productsTable.innerHTML = '';
        
        products.forEach(product => {
            const row = document.createElement('tr');
            row.id = `product-${product.id}`;
            row.innerHTML = `
                <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" rel="stylesheet">
                <td>${product.id}</td>
                <td class="name" contenteditable="false">${product.name}</td>
                <td class="category" contenteditable="false">${product.category}</td>
                <td class="section" contenteditable="false">${product.section}</td>
                <td class="location" contenteditable="false">${product.location}</td>
                <td class="quantity" contenteditable="false">${product.quantity}</td>
                <td>
                    <button class="btn btn-primary btn-sm edit-button" onclick="handleEdit(${product.id})">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-success btn-sm update-button" onclick="handleUpdate(${product.id})" style="display: none;">
                        <i class="fas fa-save"></i> Update
                    </button>
                    <button class="btn btn-danger btn-sm delete-button" onclick="handleDelete(${product.id})">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </td>
            `;
            productsTable.appendChild(row);
        });
    }

    function renderPagination(totalPages, currentPage) {
        const pagination = document.getElementById('pagination');
        pagination.innerHTML = '';

        const createPageBtn = (page, text, disabled = false) => {
            const btn = document.createElement('button');
            btn.textContent = text;
            btn.className = `btn ${page === currentPage ? 'btn-war' : 'btn-outline-war'} mx-1`;
            btn.disabled = disabled;
            btn.onclick = () => fetchProducts(page);
            return btn;
        };

        // Previous button
        pagination.appendChild(createPageBtn(currentPage - 1, '←', currentPage === 1));

        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            if (
                i === 1 || // First page
                i === totalPages || // Last page
                (i >= currentPage - 2 && i <= currentPage + 2) // Pages around current page
            ) {
                pagination.appendChild(createPageBtn(i, i.toString()));
            } else if (i === currentPage - 3 || i === currentPage + 3) {
                // Add ellipsis
                const span = document.createElement('span');
                span.textContent = '...';
                span.className = 'mx-2';
                pagination.appendChild(span);
            }
        }

        // Next button
        pagination.appendChild(createPageBtn(currentPage + 1, '→', currentPage >= totalPages));
    }

    function initializeFilters() {
        const searchInput = document.getElementById('searchInput');
        const categoryFilter = document.getElementById('categoryFilter');
        const sectionFilter = document.getElementById('sectionFilter');

        // Add event listeners
        searchInput.addEventListener('input', handleSearch);
        categoryFilter.addEventListener('change', handleSearch);
        sectionFilter.addEventListener('change', handleSearch);
    }

    function fetchCategories() {
        const categoryFilter = document.getElementById('categoryFilter');
        // Clear existing options
        categoryFilter.innerHTML = '<option value="">All Categories</option>';

        fetch('/categories')
        .then(response => response.json())
        .then(data => {
            console.log('Categories data:', data);
            if (data.categories && Array.isArray(data.categories) && data.categories.length > 0) {
                data.categories.forEach(category => {
                    if (category && category.trim()) {
                        const option = document.createElement('option');
                        option.value = category;
                        option.textContent = category;
                        categoryFilter.appendChild(option);
                    }
                });
            }
        })
        .catch(error => {
            console.error('Error fetching categories:', error);
        });
    }

    // Call fetchProducts on page load
    fetchProducts();
    fetchCategories();
});

