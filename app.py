from flask import Flask
from models import init_db
from routes import main_bp

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///products.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = 'uploads'  # Ensure this directory exists

init_db(app)

app.register_blueprint(main_bp)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)