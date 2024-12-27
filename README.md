# Pasal Inventory Management System

Pasal Inventory Management System is a web application for managing inventory using an Excel file upload. The application allows users to upload product data, search, filter, and manage the inventory.

## Features

- Upload product data via Excel file
- Search and filter products
- Edit and update product details
- Delete products
- Pagination for product listing

## Technologies Used

- Flask
- Flask-SQLAlchemy
- pandas
- Bootstrap

## Installation

1. Clone the repository:

    ```bash
    git clone https://github.com/yourusername/pasal-inventory.git
    cd pasal-inventory
    ```

2. Create a virtual environment and activate it:

    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows use `venv\Scripts\activate`
    ```

3. Install the dependencies:

    ```bash
    pip install -r requirements.txt
    ```

4. Ensure the [uploads](http://_vscodecontentref_/0) directory exists:

    ```bash
    mkdir -p uploads
    chmod 755 uploads
    ```

5. Run the application:

    ```bash
    python app.py
    ```

6. Open your web browser and navigate to `http://127.0.0.1:5000/`.

## Usage

1. **Upload Excel File**: Click on the "Upload Excel" button in the sidebar to upload an Excel file containing product data.
2. **Search and Filter**: Use the search input and filter dropdowns to search and filter products.
3. **Edit and Update**: Click the "Edit" button next to a product to edit its details. Click "Update" to save changes.
4. **Delete**: Click the "Delete" button next to a product to delete it from the inventory.
5. **Pagination**: Use the pagination controls to navigate through the product list.

## Project Structure
PasalNepal/ ├── static/ │ ├── css/ │ │ └── style.css │ ├── js/ │ │ └── main.js │ └── assets/ │ └── logo.png ├── templates/ │ ├── base.html │ └── dashboard.html ├── uploads/ ├── app.py ├── models.py ├── routes.py ├── utils.py ├── requirements.txt └── README.md

