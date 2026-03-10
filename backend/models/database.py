import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'pos_data.db')

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()

    cursor.executescript("""
        CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            unit TEXT NOT NULL DEFAULT 'kg',
            price_per_unit REAL NOT NULL DEFAULT 0,
            tax_percent REAL NOT NULL DEFAULT 0,
            hsn_code TEXT,
            barcode TEXT UNIQUE,
            active INTEGER NOT NULL DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (category_id) REFERENCES categories(id)
        );

        CREATE TABLE IF NOT EXISTS bills (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            bill_number TEXT NOT NULL UNIQUE,
            customer_name TEXT,
            customer_phone TEXT,
            customer_address TEXT,
            subtotal REAL NOT NULL DEFAULT 0,
            tax_total REAL NOT NULL DEFAULT 0,
            discount REAL NOT NULL DEFAULT 0,
            grand_total REAL NOT NULL DEFAULT 0,
            payment_method TEXT DEFAULT 'cash',
            amount_paid REAL DEFAULT 0,
            change_amount REAL DEFAULT 0,
            notes TEXT,
            status TEXT DEFAULT 'paid',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS bill_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            bill_id INTEGER NOT NULL,
            product_id INTEGER,
            product_name TEXT NOT NULL,
            unit TEXT NOT NULL,
            quantity REAL NOT NULL,
            price_per_unit REAL NOT NULL,
            tax_percent REAL NOT NULL DEFAULT 0,
            tax_amount REAL NOT NULL DEFAULT 0,
            total REAL NOT NULL,
            FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE CASCADE,
            FOREIGN KEY (product_id) REFERENCES products(id)
        );

        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS price_audit_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_id INTEGER,
            product_name TEXT,
            old_price REAL,
            new_price REAL,
            old_tax REAL,
            new_tax REAL,
            changed_by TEXT DEFAULT 'admin',
            changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)

    # Default settings
    defaults = {
        'shop_name': 'Bumiya Milk Suppliers',
        'shop_address': '',
        'shop_phone': '',
        'shop_gstin': '',
        'bill_prefix': 'BMS',
        'bill_counter': '1',
        'currency_symbol': '₹',
        'tax_inclusive': 'false',
        'printer_name': '',
        'printer_type': 'windows',
        'print_copies': '1',
        'show_tax_on_bill': 'true',
        'footer_message': 'Thank you for your business!',
    }
    for k, v in defaults.items():
        cursor.execute("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)", (k, v))

    conn.commit()
    conn.close()
    print("Database initialized.")
