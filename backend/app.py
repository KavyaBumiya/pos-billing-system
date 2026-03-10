from flask import Flask
from flask_cors import CORS
import os
from models.database import init_db
from routes.categories import categories_bp
from routes.products import products_bp
from routes.billing import billing_bp
from routes.settings import settings_bp

app = Flask(__name__)
CORS(app)
init_db()

@app.route('/')
def health():
    return {'status': 'ok', 'message': 'Bumiya POS API running', 'version': '1.0.0'}

@app.route('/api/seed', methods=['POST'])
def seed_database():
    try:
        from seed_data import seed
        seed()
        return {'success': True, 'message': 'Database seeded with product catalog'}
    except Exception as e:
        return {'error': str(e)}, 500

app.register_blueprint(categories_bp, url_prefix='/api')
app.register_blueprint(products_bp, url_prefix='/api')
app.register_blueprint(billing_bp, url_prefix='/api')
app.register_blueprint(settings_bp, url_prefix='/api')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)), debug=False)
