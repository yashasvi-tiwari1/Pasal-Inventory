import pandas as pd
import logging

def allowed_file(filename):
    """Validate file extension"""
    ALLOWED_EXTENSIONS = {'xlsx', 'xls'}
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def parse_excel_file(df):
    """Parse Excel file and validate data"""
    products = []
    try:
        # Fill NaN values with defaults
        df = df.fillna({
            'Name': 'Unknown',
            'Category': 'Uncategorized', 
            'Section': 'S0',
            'Location': 'Unknown',
            'Quantity': 0
        })

        # Validate data types
        df['Name'] = df['Name'].astype(str)
        df['Category'] = df['Category'].astype(str)
        df['Section'] = df['Section'].astype(str)
        df['Location'] = df['Location'].astype(str)
        df['Quantity'] = pd.to_numeric(df['Quantity'], errors='coerce').fillna(0).astype(int)

        for _, row in df.iterrows():
            product = {
                'name': str(row['Name']),
                'category': str(row['Category']),
                'section': str(row['Section']),
                'location': str(row['Location']), 
                'quantity': int(row['Quantity'])
            }
            products.append(product)
    except Exception as e:
        logging.error(f"Error parsing Excel file: {e}")
    return products