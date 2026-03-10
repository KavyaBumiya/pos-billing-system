from flask import Blueprint, request, jsonify
from models.database import get_db
import datetime

billing_bp = Blueprint('billing', __name__)

def generate_bill_number(db):
    prefix = db.execute("SELECT value FROM settings WHERE key='bill_prefix'").fetchone()['value']
    counter_row = db.execute("SELECT value FROM settings WHERE key='bill_counter'").fetchone()
    counter = int(counter_row['value'])
    bill_number = f"{prefix}-{str(counter).zfill(5)}"
    db.execute("UPDATE settings SET value=? WHERE key='bill_counter'", (str(counter + 1),))
    return bill_number

@billing_bp.route('/bills', methods=['GET'])
def get_bills():
    db = get_db()
    date_from = request.args.get('from')
    date_to = request.args.get('to')
    query = "SELECT * FROM bills WHERE 1=1"
    params = []
    if date_from:
        query += " AND DATE(created_at) >= ?"
        params.append(date_from)
    if date_to:
        query += " AND DATE(created_at) <= ?"
        params.append(date_to)
    query += " ORDER BY created_at DESC LIMIT 200"
    rows = db.execute(query, params).fetchall()
    db.close()
    return jsonify([dict(r) for r in rows])

@billing_bp.route('/bills/<int:bill_id>', methods=['GET'])
def get_bill(bill_id):
    db = get_db()
    bill = db.execute("SELECT * FROM bills WHERE id=?", (bill_id,)).fetchone()
    if not bill:
        db.close()
        return jsonify({'error': 'Bill not found'}), 404
    items = db.execute("SELECT * FROM bill_items WHERE bill_id=?", (bill_id,)).fetchall()
    db.close()
    result = dict(bill)
    result['items'] = [dict(i) for i in items]
    return jsonify(result)

@billing_bp.route('/bills', methods=['POST'])
def create_bill():
    data = request.json
    items = data.get('items', [])
    if not items:
        return jsonify({'error': 'Bill must have at least one item'}), 400

    db = get_db()
    try:
        bill_number = generate_bill_number(db)
        subtotal = 0
        tax_total = 0

        processed_items = []
        for item in items:
            qty = float(item['quantity'])
            price = float(item['price_per_unit'])
            tax_pct = float(item.get('tax_percent', 0))
            line_base = round(qty * price, 2)
            tax_amt = round(line_base * tax_pct / 100, 2)
            line_total = round(line_base + tax_amt, 2)
            subtotal += line_base
            tax_total += tax_amt
            processed_items.append({
                'product_id': item.get('product_id'),
                'product_name': item['product_name'],
                'unit': item.get('unit', 'kg'),
                'quantity': qty,
                'price_per_unit': price,
                'tax_percent': tax_pct,
                'tax_amount': tax_amt,
                'total': line_total,
            })

        discount = float(data.get('discount', 0))
        grand_total = round(subtotal + tax_total - discount, 2)
        amount_paid = float(data.get('amount_paid', grand_total))
        change_amount = round(amount_paid - grand_total, 2)

        cur = db.execute(
            """INSERT INTO bills (bill_number, customer_name, customer_phone, customer_address,
               subtotal, tax_total, discount, grand_total, payment_method, amount_paid, change_amount, notes)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                bill_number,
                data.get('customer_name', ''),
                data.get('customer_phone', ''),
                data.get('customer_address', ''),
                round(subtotal, 2), round(tax_total, 2),
                discount, grand_total,
                data.get('payment_method', 'cash'),
                amount_paid, change_amount,
                data.get('notes', '')
            )
        )
        bill_id = cur.lastrowid

        for item in processed_items:
            db.execute(
                """INSERT INTO bill_items (bill_id, product_id, product_name, unit, quantity,
                   price_per_unit, tax_percent, tax_amount, total)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (
                    bill_id, item['product_id'], item['product_name'], item['unit'],
                    item['quantity'], item['price_per_unit'], item['tax_percent'],
                    item['tax_amount'], item['total']
                )
            )

        db.commit()
        bill = db.execute("SELECT * FROM bills WHERE id=?", (bill_id,)).fetchone()
        bill_items = db.execute("SELECT * FROM bill_items WHERE bill_id=?", (bill_id,)).fetchall()
        db.close()
        result = dict(bill)
        result['items'] = [dict(i) for i in bill_items]
        return jsonify(result), 201
    except Exception as e:
        db.close()
        return jsonify({'error': str(e)}), 400

@billing_bp.route('/bills/<int:bill_id>', methods=['DELETE'])
def cancel_bill(bill_id):
    db = get_db()
    db.execute("UPDATE bills SET status='cancelled' WHERE id=?", (bill_id,))
    db.commit()
    db.close()
    return jsonify({'success': True})

@billing_bp.route('/bills/summary', methods=['GET'])
def get_summary():
    db = get_db()
    today = datetime.date.today().isoformat()
    result = {}
    result['today'] = dict(db.execute("""
        SELECT COUNT(*) as count, COALESCE(SUM(grand_total),0) as total
        FROM bills WHERE DATE(created_at)=? AND status='paid'
    """, (today,)).fetchone())
    result['month'] = dict(db.execute("""
        SELECT COUNT(*) as count, COALESCE(SUM(grand_total),0) as total
        FROM bills WHERE strftime('%Y-%m', created_at)=strftime('%Y-%m', 'now') AND status='paid'
    """).fetchone())
    result['top_products'] = [dict(r) for r in db.execute("""
        SELECT bi.product_name, SUM(bi.quantity) as total_qty, SUM(bi.total) as total_amount
        FROM bill_items bi JOIN bills b ON bi.bill_id=b.id
        WHERE b.status='paid' AND DATE(b.created_at)=?
        GROUP BY bi.product_name ORDER BY total_amount DESC LIMIT 5
    """, (today,)).fetchall()]
    db.close()
    return jsonify(result)
