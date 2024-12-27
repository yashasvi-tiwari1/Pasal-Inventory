import glob
import math
import os
import logging
import uuid
import pandas as pd
from flask import Blueprint, request, jsonify, current_app, render_template
from werkzeug.utils import secure_filename
from utils import parse_excel_file, allowed_file
from models import Product, db
import json
from sqlalchemy import Integer, Column, String
main_bp = Blueprint('main', __name__)

@main_bp.route('/')
def dashboard():
    return render_template('dashboard.html')

@main_bp.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400

    file = request.files['file']
    if not file or file.filename == '':
        return jsonify({'error': 'No file selected'}), 400

    if not allowed_file(file.filename):
        return jsonify({'error': 'Invalid file type'}), 400

    try:
        filename = secure_filename(file.filename)
        filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], f"{uuid.uuid4()}_{filename}")
        file.save(filepath)

        # Read and validate Excel
        df = pd.read_excel(filepath)
        
        # Fill NaN values with default values
        df['Name'] = df['Name'].fillna('Unknown')
        df['Category'] = df['Category'].fillna('Uncategorized')
        df['Section'] = df['Section'].fillna('S0')
        df['Location'] = df['Location'].fillna('Unknown')
        df['Quantity'] = df['Quantity'].fillna(0)

        required_columns = ['Name', 'Category', 'Section', 'Location', 'Quantity']
        missing_columns = [col for col in required_columns if col not in df.columns]
        
        if missing_columns:
            os.remove(filepath)
            return jsonify({'error': f'Missing columns: {", ".join(missing_columns)}'}), 400

        # Save data to database
        for _, row in df.iterrows():
            product = Product(
                name=str(row['Name']),
                category=str(row['Category']),
                section=str(row['Section']),
                location=str(row['Location']),
                quantity=int(row['Quantity'])
            )
            db.session.add(product)
        
        db.session.commit()
        os.remove(filepath)  # Clean up the uploaded file

        return jsonify({'message': 'File uploaded and data saved successfully'})

    except Exception as e:
        if os.path.exists(filepath):
            os.remove(filepath)
        logging.error(f"Upload error: {str(e)}")
        return jsonify({'error': str(e)}), 400
    
@main_bp.route('/categories', methods=['GET']) 
def get_categories():
    try:
        categories = db.session.query(Product.category).distinct().all()
        categories = [category[0] for category in categories]
        categories = sorted([str(cat).strip() for cat in categories if str(cat).strip()])
        
        logging.debug(f"Found categories: {categories}")
        return jsonify({'categories': categories})
        
    except Exception as e:
        logging.error(f"Error fetching categories: {e}")
        return jsonify({'categories': []})
    

@main_bp.route('/products', methods=['GET'])
def get_products():
    try: 
        page = request.args.get('page', 1, type=int)  # Get page, default to 1
        per_page = request.args.get('per_page', type=int)  # Get per_page

        query = db.session.query(Product)

        if per_page:  # If per_page is provided in the request
            per_page = min(200, max(1, per_page))  # Validate per_page
            total_products = query.count()
            total_pages = math.ceil(total_products / per_page)
            page = min(page, total_pages)  # Ensure page is within valid range
            products = query.offset((page - 1) * per_page).limit(per_page).all()
        else:  # If per_page is not provided, fetch all
            products = query.all()

        products = [product.to_dict() for product in products]

        response_data = {
            'products': products,
        }
        if per_page:  # Add pagination data only if per_page was provided
            response_data.update({
                'total': total_products,
                'pages': total_pages,
                'current_page': page,
                'per_page': per_page
            })

        return jsonify(response_data)

    except Exception as e:
        logging.error(f"Error fetching products: {e}")
        return jsonify({'products': [], 'total': 0, 'pages': 0, 'current_page': 1, 'per_page': 10})
    
@main_bp.route('/search', methods=['GET'])
def search_products():
    search_query = request.args.get('q', '').lower()
    category = request.args.get('category')
    section = request.args.get('section')
    page = max(1, request.args.get('page', 1, type=int))
    per_page = min(100, max(1, request.args.get('per_page', 10, type=int)))

    try:
        # Get products from database
        query = db.session.query(Product)
        
        # Apply filters
        if search_query:
            query = query.filter(Product.name.ilike(f"%{search_query}%"))
        if category:
            query = query.filter(Product.category == category)
        if section:
            query = query.filter(Product.section == section)
        
        total_products = query.count()
        total_pages = math.ceil(total_products / per_page)
        
        # Paginate results
        products = query.offset((page - 1) * per_page).limit(per_page).all()
        products = [product.to_dict() for product in products]
        
        return jsonify({
            'products': products,
            'total': total_products,
            'pages': total_pages,
            'current_page': page,
            'per_page': per_page
        })
        
    except Exception as e:
        logging.error(f"Search error: {e}")
        return jsonify({'products': [], 'total': 0, 'pages': 0, 'current_page': page, 'per_page': per_page})
    
@main_bp.route('/product/<int:product_id>', methods=['PUT'])
def update_product(product_id):
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        product = db.session.query(Product).filter(Product.id == product_id).first()
        if not product:
            return jsonify({'error': 'Product not found'}), 404

        product.name = data['name']
        product.category = data['category']
        product.section = data['section']
        product.location = data['location']
        product.quantity = data.get('quantity', 0)

        db.session.commit()
        return jsonify({'message': 'Product updated successfully'})

    except Exception as e:
        logging.error(f"Update error: {str(e)}")
        return jsonify({'error': str(e)}), 400

@main_bp.route('/product/<int:product_id>', methods=['DELETE'])
def delete_product(product_id):
    try:
        product = db.session.query(Product).filter(Product.id == product_id).first()
        if not product:
            return jsonify({'error': 'Product not found'}), 404

        db.session.delete(product)
        db.session.commit()
        
        return jsonify({'message': 'Product deleted successfully'})
    except Exception as e:
        logging.error(f"Delete error: {e}")
        return jsonify({'error': str(e)}), 400



 