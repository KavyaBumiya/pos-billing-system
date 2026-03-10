from flask import Blueprint, request, jsonify
from models.database import get_db
import subprocess
import sys

settings_bp = Blueprint('settings', __name__)

@settings_bp.route('/settings', methods=['GET'])
def get_settings():
    db = get_db()
    rows = db.execute("SELECT * FROM settings").fetchall()
    db.close()
    return jsonify({r['key']: r['value'] for r in rows})

@settings_bp.route('/settings', methods=['POST'])
def update_settings():
    data = request.json
    db = get_db()
    for k, v in data.items():
        db.execute("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", (k, str(v)))
    db.commit()
    db.close()
    return jsonify({'success': True})

@settings_bp.route('/printers', methods=['GET'])
def get_printers():
    """List available Windows printers."""
    printers = []
    try:
        import win32print
        for p in win32print.EnumPrinters(win32print.PRINTER_ENUM_LOCAL | win32print.PRINTER_ENUM_CONNECTIONS):
            printers.append({'name': p[2], 'port': p[3]})
    except ImportError:
        # Fallback: use PowerShell
        try:
            result = subprocess.run(
                ['powershell', '-Command', 'Get-Printer | Select-Object -ExpandProperty Name'],
                capture_output=True, text=True, timeout=5
            )
            for line in result.stdout.strip().splitlines():
                if line.strip():
                    printers.append({'name': line.strip(), 'port': ''})
        except Exception:
            pass
    return jsonify(printers)

@settings_bp.route('/print-bill', methods=['POST'])
def print_bill():
    """Print a bill using Windows printer or raw text."""
    data = request.json
    bill_text = data.get('bill_text', '')
    printer_name = data.get('printer_name', '')

    if not bill_text:
        return jsonify({'error': 'No bill text provided'}), 400

    try:
        import win32print
        import win32ui
        if not printer_name:
            printer_name = win32print.GetDefaultPrinter()
        hprinter = win32print.OpenPrinter(printer_name)
        try:
            win32print.StartDocPrinter(hprinter, 1, ("POS Bill", None, "RAW"))
            win32print.StartPagePrinter(hprinter)
            win32print.WritePrinter(hprinter, bill_text.encode('utf-8'))
            win32print.EndPagePrinter(hprinter)
            win32print.EndDocPrinter(hprinter)
        finally:
            win32print.ClosePrinter(hprinter)
        return jsonify({'success': True, 'printer': printer_name})
    except ImportError:
        # Save to temp file and print via notepad
        import tempfile, os
        with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False, encoding='utf-8') as f:
            f.write(bill_text)
            tmp = f.name
        try:
            if printer_name:
                subprocess.run(['notepad', '/p', tmp], timeout=10)
            else:
                subprocess.run(['notepad', '/p', tmp], timeout=10)
        except Exception:
            pass
        os.unlink(tmp)
        return jsonify({'success': True, 'printer': printer_name or 'default'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
