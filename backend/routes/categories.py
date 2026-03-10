from flask import Blueprint, request, jsonify
from models.database import get_db

categories_bp = Blueprint('categories', __name__)

@categories_bp.route('/categories', methods=['GET'])
def get_categories():
    db = get_db()
    rows = db.execute("SELECT * FROM categories ORDER BY name").fetchall()
    db.close()
    return jsonify([dict(r) for r in rows])

@categories_bp.route('/categories', methods=['POST'])
def create_category():
    data = request.json
    name = (data.get('name') or '').strip()
    if not name:
        return jsonify({'error': 'Category name is required'}), 400
    db = get_db()
    try:
        cur = db.execute(
            "INSERT INTO categories (name, description) VALUES (?, ?)",
            (name, data.get('description', ''))
        )
        db.commit()
        row = db.execute("SELECT * FROM categories WHERE id=?", (cur.lastrowid,)).fetchone()
        db.close()
        return jsonify(dict(row)), 201
    except Exception as e:
        db.close()
        return jsonify({'error': str(e)}), 400

@categories_bp.route('/categories/<int:cat_id>', methods=['PUT'])
def update_category(cat_id):
    data = request.json
    name = (data.get('name') or '').strip()
    if not name:
        return jsonify({'error': 'Category name is required'}), 400
    db = get_db()
    db.execute(
        "UPDATE categories SET name=?, description=? WHERE id=?",
        (name, data.get('description', ''), cat_id)
    )
    db.commit()
    row = db.execute("SELECT * FROM categories WHERE id=?", (cat_id,)).fetchone()
    db.close()
    return jsonify(dict(row))

@categories_bp.route('/categories/<int:cat_id>', methods=['DELETE'])
def delete_category(cat_id):
    db = get_db()
    count = db.execute("SELECT COUNT(*) as c FROM products WHERE category_id=?", (cat_id,)).fetchone()['c']
    if count > 0:
        db.close()
        return jsonify({'error': f'Cannot delete: {count} product(s) exist in this category'}), 400
    db.execute("DELETE FROM categories WHERE id=?", (cat_id,))
    db.commit()
    db.close()
    return jsonify({'success': True})
