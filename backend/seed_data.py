"""
Seed script for Bumiya Milk Suppliers POS.
Prices stored as Price Before Tax; tax is applied at billing time.
Price Before Tax = Price After Tax / (1 + tax_rate)
Run: python seed_data.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from models.database import get_db, init_db

# Format: (category_name, [(product_name, price_before_tax, tax_percent, unit), ...])
CATALOG = [
    ("Matho/ Shrikhand", [
        ("Elaichi Matho",           285.71, 5, "kg"),
        ("Pineapple Cherry Matho",  323.81, 5, "kg"),
        ("Royal Mango Matho",       361.90, 5, "kg"),
        ("Fresh Fruit Matho",       361.90, 5, "kg"),
        ("Kesar Elaichi Matho",     361.90, 5, "kg"),
        ("American Dryfruit Matho", 361.90, 5, "kg"),
        ("Butter Scotch Matho",     361.90, 5, "kg"),
        ("Green Pista Matho",       361.90, 5, "kg"),
        ("Badam Chocolate Matho",   361.90, 5, "kg"),
        ("Mava Badam Matho",        361.90, 5, "kg"),
        ("Rajbhog Matho",           419.05, 5, "kg"),
    ]),
    ("Basundi", [
        ("Kesar Pista Basundi",  380.95, 5, "kg"),
        ("Sitafal Basundi",      380.95, 5, "kg"),
        ("Kesar Angoor Basundi", 380.95, 5, "kg"),
        ("Rabdi",                380.95, 5, "kg"),
    ]),
    ("Cream Salad", [
        ("Dudh Pak",     371.43, 5, "kg"),
        ("Mango Delight",380.95, 5, "kg"),
        ("Cream Salad",  390.48, 5, "kg"),
    ]),
    ("Milk Products", [
        ("Dahi",         110.00, 0, "kg"),
        ("Cream",        380.95, 5, "kg"),
        ("Paneer",       440.00, 0, "kg"),
        ("White Butter", 514.29, 5, "kg"),
        ("Ghee",         647.62, 5, "kg"),
    ]),
    ("Mango Ras", [
        ("Mango Ras",       228.57, 5, "kg"),
        ("Hafus Mango Ras",   0.00, 5, "kg"),   # price TBD
    ]),
    ("Kaju Sweets", [
        ("Kaju Katri",       1028.57, 5, "kg"),
        ("Kesar Kaju Katri", 1047.62, 5, "kg"),
        ("Kaju Kesar Roll",  1047.62, 5, "kg"),
        ("Kaju Anjeer Roll", 1047.62, 5, "kg"),
        ("Kaju Dryfruit Mix",1238.10, 5, "kg"),
    ]),
    ("Penda", [
        ("Mathura Peda",        476.19, 5, "kg"),
        ("Malai Peda",          495.24, 5, "kg"),
        ("Chocolate Fruit Cake",514.29, 5, "kg"),
        ("Gupchup",             514.29, 5, "kg"),
        ("Kesar Peda",          533.33, 5, "kg"),
        ("Modak",               476.19, 5, "kg"),
    ]),
    ("Ghee Sweets", [
        ("Sonpapdi",             571.43, 5, "kg"),
        ("Mysore",               571.43, 5, "kg"),
        ("Kesar Motichoor Ladoo",552.38, 5, "kg"),
        ("Mohanthal",            647.62, 5, "kg"),
        ("Dryfruit Ghari",       857.14, 5, "kg"),
    ]),
    ("Barfi", [
        ("Malai Barfi",      514.29, 5, "kg"),
        ("Chocolate Barfi",  514.29, 5, "kg"),
        ("Mango Barfi",      514.29, 5, "kg"),
        ("Kesar Barfi",      571.43, 5, "kg"),
        ("Anjeer Barfi",     571.43, 5, "kg"),
        ("Dryfruit Gulabpak",571.43, 5, "kg"),
    ]),
    ("Bengali Sweets", [
        ("Rasgulla",     68.57, 5, "piece"),
        ("Kala Jam",     68.57, 5, "piece"),
        ("Bengali Sweet",33.33, 5, "piece"),
        ("Ras Malai",   400.00, 5, "kg"),
        ("Gulab Jamun", 323.81, 5, "kg"),
    ]),
    ("Halwa", [
        ("Dudhi Halwa", 476.19, 5, "kg"),
        ("Kopra Pak",   476.19, 5, "kg"),
        ("Doodh Halwa", 571.43, 5, "kg"),
    ]),
]

def seed():
    init_db()
    db = get_db()

    # Remove old dummy categories if they exist
    for old in ['Milk', 'Paneer', 'Butter', 'Curd']:
        db.execute("DELETE FROM categories WHERE name=? AND id NOT IN (SELECT DISTINCT category_id FROM products)", (old,))

    inserted_cats = 0
    inserted_prods = 0

    for cat_name, products in CATALOG:
        # Upsert category
        existing = db.execute("SELECT id FROM categories WHERE name=?", (cat_name,)).fetchone()
        if existing:
            cat_id = existing['id']
        else:
            cur = db.execute("INSERT INTO categories (name) VALUES (?)", (cat_name,))
            cat_id = cur.lastrowid
            inserted_cats += 1

        for (prod_name, price, tax, unit) in products:
            exists = db.execute(
                "SELECT id FROM products WHERE name=? AND category_id=?", (prod_name, cat_id)
            ).fetchone()
            if not exists:
                db.execute(
                    "INSERT INTO products (category_id, name, unit, price_per_unit, tax_percent, active) VALUES (?,?,?,?,?,1)",
                    (cat_id, prod_name, unit, price, tax)
                )
                inserted_prods += 1

    db.commit()
    db.close()
    print(f"Seeding complete: {inserted_cats} new categories, {inserted_prods} new products added.")

if __name__ == '__main__':
    seed()
