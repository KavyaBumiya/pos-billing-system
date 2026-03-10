from flask import Blueprint, request, jsonify
from models.database import get_db

products_bp = Blueprint('products', __name__)

@products_bp.route('/products', methods=['GET'])
def get_products():
    db = get_db()
    cat_id = request.args.get('category_id')
    active = request.args.get('active', '1')
    query = """
        SELECT p.*, c.name as category_name
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE 1=1
    """
    params = []
    if cat_id:
        query += " AND p.category_id=?"
        params.append(cat_id)
    if active != 'all':
        query += " AND p.active=?"
        params.append(int(active))
    query += " ORDER BY c.name, p.name"
    rows = db.execute(query, params).fetchall()
    db.close()
    return jsonify([dict(r) for r in rows])

@products_bp.route('/products', methods=['POST'])
def create_product():
    data = request.json
    name = (data.get('name') or '').strip()
    if not name:
        return jsonify({'error': 'Product name is required'}), 400
    if not data.get('category_id'):
        return jsonify({'error': 'Category is required'}), 400
    db = get_db()
    try:
        cur = db.execute(
            """INSERT INTO products (category_id, name, unit, price_per_unit, tax_percent, hsn_code, barcode, active)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                data['category_id'], name,
                data.get('unit', 'kg'),
                float(data.get('price_per_unit', 0)),
                float(data.get('tax_percent', 0)),
                data.get('hsn_code', ''),
                data.get('barcode', '') or None,
                int(data.get('active', 1))
            )
        )
        db.commit()
        row = db.execute("""
            SELECT p.*, c.name as category_name FROM products p
            LEFT JOIN categories c ON p.category_id=c.id WHERE p.id=?
        """, (cur.lastrowid,)).fetchone()
        db.close()
        return jsonify(dict(row)), 201
    except Exception as e:
        db.close()
        return jsonify({'error': str(e)}), 400

@products_bp.route('/products/<int:prod_id>', methods=['PUT'])
def update_product(prod_id):
    data = request.json
    db = get_db()
    old = db.execute("SELECT * FROM products WHERE id=?", (prod_id,)).fetchone()
    if not old:
        db.close()
        return jsonify({'error': 'Product not found'}), 404
    name = (data.get('name') or old['name']).strip()
    new_price = float(data.get('price_per_unit', old['price_per_unit']))
    new_tax = float(data.get('tax_percent', old['tax_percent']))

    # Log price/tax changes
    if new_price != old['price_per_unit'] or new_tax != old['tax_percent']:
        db.execute(
            """INSERT INTO price_audit_log (product_id, product_name, old_price, new_price, old_tax, new_tax)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (prod_id, old['name'], old['price_per_unit'], new_price, old['tax_percent'], new_tax)
        )

    db.execute(
        """UPDATE products SET category_id=?, name=?, unit=?, price_per_unit=?, tax_percent=?,
           hsn_code=?, barcode=?, active=?, updated_at=CURRENT_TIMESTAMP WHERE id=?""",
        (
            data.get('category_id', old['category_id']),
            name,
            data.get('unit', old['unit']),
            new_price, new_tax,
            data.get('hsn_code', old['hsn_code']),
            data.get('barcode', old['barcode']) or None,
            int(data.get('active', old['active'])),
            prod_id
        )
    )
    db.commit()
    row = db.execute("""
        SELECT p.*, c.name as category_name FROM products p
        LEFT JOIN categories c ON p.category_id=c.id WHERE p.id=?
    """, (prod_id,)).fetchone()
    db.close()
    return jsonify(dict(row))

@products_bp.route('/products/<int:prod_id>', methods=['DELETE'])
def delete_product(prod_id):
    db = get_db()
    db.execute("UPDATE products SET active=0 WHERE id=?", (prod_id,))
    db.commit()
    db.close()
    return jsonify({'success': True})

@products_bp.route('/products/bulk-update', methods=['POST'])
def bulk_update_products():
    """Bulk update price or tax for multiple products."""
    data = request.json
    # data: { product_ids: [], price_per_unit?: float, tax_percent?: float, price_change_type?: 'set'|'percent_increase'|'percent_decrease'|'amount_increase'|'amount_decrease' }
    ids = data.get('product_ids', [])
    if not ids:
        return jsonify({'error': 'No products selected'}), 400
    db = get_db()
    updated = 0
    for pid in ids:
        prod = db.execute("SELECT * FROM products WHERE id=?", (pid,)).fetchone()
        if not prod:
            continue
        new_price = prod['price_per_unit']
        new_tax = prod['tax_percent']

        if 'price_per_unit' in data:
            change_type = data.get('price_change_type', 'set')
            val = float(data['price_per_unit'])
            if change_type == 'set':
                new_price = val
            elif change_type == 'percent_increase':
                new_price = round(prod['price_per_unit'] * (1 + val / 100), 2)
            elif change_type == 'percent_decrease':
                new_price = round(prod['price_per_unit'] * (1 - val / 100), 2)
            elif change_type == 'amount_increase':
                new_price = round(prod['price_per_unit'] + val, 2)
            elif change_type == 'amount_decrease':
                new_price = round(prod['price_per_unit'] - val, 2)

        if 'tax_percent' in data:
            new_tax = float(data['tax_percent'])

        if new_price != prod['price_per_unit'] or new_tax != prod['tax_percent']:
            db.execute(
                """INSERT INTO price_audit_log (product_id, product_name, old_price, new_price, old_tax, new_tax)
                   VALUES (?, ?, ?, ?, ?, ?)""",
                (pid, prod['name'], prod['price_per_unit'], new_price, prod['tax_percent'], new_tax)
            )
            db.execute(
                "UPDATE products SET price_per_unit=?, tax_percent=?, updated_at=CURRENT_TIMESTAMP WHERE id=?",
                (new_price, new_tax, pid)
            )
            updated += 1

    db.commit()
    db.close()
    return jsonify({'success': True, 'updated': updated})

@products_bp.route('/products/search', methods=['GET'])
def search_products():
    q = request.args.get('q', '').strip()
    db = get_db()
    rows = db.execute("""
        SELECT p.*, c.name as category_name FROM products p
        LEFT JOIN categories c ON p.category_id=c.id
        WHERE p.active=1 AND (p.name LIKE ? OR p.barcode=? OR c.name LIKE ?)
        ORDER BY p.name LIMIT 20
    """, (f'%{q}%', q, f'%{q}%')).fetchall()
    db.close()
    return jsonify([dict(r) for r in rows])

@products_bp.route('/products/audit-log', methods=['GET'])
def get_audit_log():
    db = get_db()
    rows = db.execute(
        "SELECT * FROM price_audit_log ORDER BY changed_at DESC LIMIT 200"
    ).fetchall()
    db.close()
    return jsonify([dict(r) for r in rows])
