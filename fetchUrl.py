import sqlite3

DB_NAME = 'data.db'

def get_db():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    return conn

def find_endpoint(endpoint_path):
    conn = get_db()
    try:
        row = conn.execute("SELECT url FROM urls WHERE endpoint = ?", (endpoint_path,)).fetchone()
        return row['url'] if row else None
    finally:
        conn.close()

def find_endpoint_pass(endpoint_path):
    conn = get_db()
    try:
        row = conn.execute("SELECT password FROM urls WHERE endpoint = ?", (endpoint_path,)).fetchone()
        if row and row['password']:
            return row['password']
        return False
    finally:
        conn.close()

def find_endpoint_uses(endpoint_path):
    conn = get_db()
    try:
        row = conn.execute("SELECT uses FROM urls WHERE endpoint = ?", (endpoint_path,)).fetchone()
        if row:
            return int(row['uses'])
        return False
    finally:
        conn.close()

def redirect(endpoint_path):
    conn = get_db()
    try:
        row = conn.execute("SELECT redirect FROM urls WHERE endpoint = ?", (endpoint_path,)).fetchone()
        if row:
            return bool(row['redirect'])
        return False
    finally:
        conn.close()

def load_data():
    conn = get_db()
    try:
        rows = conn.execute("SELECT * FROM urls").fetchall()
        data = {}
        for row in rows:
            data[str(row['id'])] = {
                "endpoint": row['endpoint'],
                "url": row['url'],
                "expiry": row['expiry'],
                "pass": row['password'],
                "redirect": bool(row['redirect']),
                "uses": row['uses']
            }
        return data
    finally:
        conn.close()

def add_url(endpoint, url, expiry, password, redirect, uses):
    conn = get_db()
    try:
        conn.execute("INSERT INTO urls (endpoint, url, expiry, password, redirect, uses) VALUES (?, ?, ?, ?, ?, ?)",
                     (endpoint, url, expiry, password, 1 if redirect else 0, uses))
        conn.commit()
        return True
    except sqlite3.IntegrityError:
        return False
    except Exception as e:
        print(f"Error adding URL: {e}")
        return False
    finally:
        conn.close()

# Deprecated but kept for compatibility if needed, though we should remove usage
def save_data(data):
    pass

def change_endpoint(index, entry):
    conn = get_db()
    try:
        conn.execute("UPDATE urls SET endpoint = ?, url = ?, expiry = ?, password = ?, redirect = ?, uses = ? WHERE id = ?",
                     (entry['endpoint'], entry['url'], entry['expiry'], entry['pass'], 1 if entry['redirect'] else 0, entry['uses'], index))
        conn.commit()
        return True
    except Exception as e:
        print(f"Error updating endpoint: {e}")
        return False
    finally:
        conn.close()

def change_uses(index, uses):
    conn = get_db()
    try:
        conn.execute("UPDATE urls SET uses = ? WHERE id = ?", (uses, index))
        conn.commit()
        return True
    except:
        return False
    finally:
        conn.close()

def remove_endpoint(index):
    conn = get_db()
    try:
        conn.execute("DELETE FROM urls WHERE id = ?", (index,))
        conn.commit()
        return True
    except:
        return False
    finally:
        conn.close()

def find_key_by_endpoint(endpoint):
    conn = get_db()
    try:
        row = conn.execute("SELECT id FROM urls WHERE endpoint = ?", (endpoint,)).fetchone()
        return str(row['id']) if row else None
    finally:
        conn.close()

def load_data_from_endpoint(endpoint):
    conn = get_db()
    try:
        row = conn.execute("SELECT * FROM urls WHERE endpoint = ?", (endpoint,)).fetchone()
        if row:
            return [{
                "endpoint": row['endpoint'],
                "url": row['url'],
                "expiry": row['expiry'],
                "pass": row['password'],
                "redirect": bool(row['redirect']),
                "uses": row['uses']
            }]
        return []
    finally:
        conn.close()
