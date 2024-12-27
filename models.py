from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class Product(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    category = db.Column(db.String(100), nullable=False)
    section = db.Column(db.String(100), nullable=False)
    location = db.Column(db.String(100), nullable=False, default='Unknown')
    quantity = db.Column(db.Integer, nullable=False, default=0)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'category': self.category,
            'section': self.section,
            'location': self.location,
            'quantity': self.quantity
        }

def init_db(app):
    db.init_app(app)
    with app.app_context():
        db.create_all()