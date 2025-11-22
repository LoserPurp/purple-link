from flask import Flask, render_template, request, flash, redirect, url_for, session, jsonify
from flask_caching import Cache
from waitress import serve
from functools import wraps
from datetime import datetime, timedelta
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes
from cryptography.fernet import Fernet
import fetchUrl
import os
import random
import string
import threading
import time
import qrcode
import io
import base64
import validators
from PIL import Image
import requests
import sqlite3
from user_agents import parse

app = Flask(__name__)
app.secret_key = 'key69'

def hash(passphrase, salt, iterations=100000):
    passphrase_bytes = passphrase.encode('utf-8')
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=iterations
    )
    derived_key = kdf.derive(passphrase_bytes)

    return base64.urlsafe_b64encode(derived_key).decode('utf-8')

# Basic configuration for in-memory caching
app.config['CACHE_TYPE'] = 'SimpleCache'  # Choose a caching backend
app.config['CACHE_DEFAULT_TIMEOUT'] = 300  # Default timeout in seconds

cache = Cache(app)

# Database initialization
def check_and_migrate_db():
    try:
        conn = sqlite3.connect('data.db')
        c = conn.cursor()
        
        # Get current columns
        c.execute("PRAGMA table_info(users)")
        columns = [info[1] for info in c.fetchall()]
        
        new_columns = {
            'perm_create': 'INTEGER DEFAULT 1',
            'perm_custom_alias': 'INTEGER DEFAULT 0',
            'perm_expiry': 'INTEGER DEFAULT 0',
            'perm_uses': 'INTEGER DEFAULT 0',
            'perm_password': 'INTEGER DEFAULT 0',
            'perm_redirect': 'INTEGER DEFAULT 0'
        }
        
        for col, dtype in new_columns.items():
            if col not in columns:
                print(f"Migrating: Adding {col} to users table")
                c.execute(f"ALTER TABLE users ADD COLUMN {col} {dtype}")
                
                # Set defaults: Admins get everything, Users get nothing (except create which is default 1)
                # Wait, perm_create default is 1.
                c.execute(f"UPDATE users SET {col} = 1 WHERE user_group = 'administrator'")
                
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"Migration error: {e}")

def init_db():
    conn = sqlite3.connect('data.db')
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS users
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  username TEXT UNIQUE NOT NULL,
                  password_hash TEXT NOT NULL,
                  salt TEXT NOT NULL,
                  user_group TEXT NOT NULL,
                  perm_create INTEGER DEFAULT 1,
                  perm_custom_alias INTEGER DEFAULT 0,
                  perm_expiry INTEGER DEFAULT 0,
                  perm_uses INTEGER DEFAULT 0,
                  perm_password INTEGER DEFAULT 0,
                  perm_redirect INTEGER DEFAULT 0)''')
    c.execute('''CREATE TABLE IF NOT EXISTS urls
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  endpoint TEXT UNIQUE NOT NULL,
                  url TEXT NOT NULL,
                  expiry TEXT,
                  password TEXT,
                  redirect INTEGER,
                  uses INTEGER)''')
    conn.commit()
    conn.close()
    check_and_migrate_db()

def add_default_user():
    try:
        conn = sqlite3.connect('data.db')
        c = conn.cursor()
        
        # Check if any user exists
        c.execute("SELECT count(*) FROM users")
        count = c.fetchone()[0]
        
        if count == 0:
            print("No users found. Creating default admin user.")
            username = "admin"
            password = "admin"
            group = "administrator"
            
            # Generate random salt (16 bytes)
            salt = os.urandom(16)
            password_hash = hash(password, salt)
            
            # Store salt as base64 string
            salt_b64 = base64.urlsafe_b64encode(salt).decode('utf-8')
            
            c.execute("INSERT INTO users (username, password_hash, salt, user_group, perm_create, perm_custom_alias, perm_expiry, perm_uses, perm_password, perm_redirect) VALUES (?, ?, ?, ?, 1, 1, 1, 1, 1, 1)",
                      (username, password_hash, salt_b64, group))
            conn.commit()
            print("Default admin user created.")
            
        conn.close()
    except Exception as e:
        print(f"Error creating default user: {e}")

# Initialize DB
init_db()
# Add default user if needed
add_default_user()

# Get the absolute path of the current script directory
script_directory = os.path.dirname(os.path.abspath(__file__)) 

# Log user access
def log_user_access(endpoint, user_agent):
    try:
        ip_address = requests.get('https://ip.olayzen.net').text.strip()
    except requests.RequestException:
        ip_address = 'Unknown'  # Fallback if the request fails

    # Parse user agent to get device type
    ua = parse(user_agent)
    if ua.is_mobile:
        device_type = 'Mobile'
    elif ua.is_tablet:
        device_type = 'Tablet'
    elif ua.is_pc:
        device_type = 'PC'
    elif ua.is_bot:
        device_type = 'Bot'
    else:
        device_type = 'Other'

    log_entry = f"{datetime.now().strftime('%Y-%m-%d %H:%M:%S')} - IP: {ip_address} - Endpoint: {endpoint} - User Agent: {user_agent} - Device: {device_type}\n"
    log_file_path = os.path.join(script_directory, "access.log")  # Change to .log file

    # Append log entry to the log file
    with open(log_file_path, 'a') as log_file:
        log_file.write(log_entry)

#makes random string
def generate_random_string():
    while True:
        rndm = ''.join(random.choices(string.ascii_letters, k=5))
        if not fetchUrl.find_endpoint("/" + rndm):
            return rndm


def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'username' not in session:  # Check if user is in session (logged in)
            flash('Please log in to access this page.', 'warning')
            return redirect(url_for('home'))  # Redirect to login if not logged in
        return f(*args, **kwargs)
    return decorated_function

#Checks if the time in an entry is older than when the check runs
def check_time():
    # Current time
    current_time = datetime.now()

    data = fetchUrl.load_data()

    for key in data:
        entry = data[key]
        #check if entry has a expiration date
        if entry['expiry']:
            given_time_str = entry['expiry']

            #parse the string into a datetime object
            given_time = datetime.strptime(given_time_str, "%Y-%m-%d %H:%M")

            #check if current time is after the expiration
            if current_time > given_time:
                fetchUrl.remove_endpoint(key)
                print(entry[0] + " Removed")
                return redirect('/404.html')

def convert_time_format(time_str):
    if not time_str:
        return ""
    # Replace 'T' with space to match the desired format
    corrected_time_str = time_str.replace('T', ' ')
    # Convert to datetime object
    dt = datetime.strptime(corrected_time_str, '%Y-%m-%d %H:%M')
    # Convert the datetime object back to a string in the same format
    return dt.strftime('%Y-%m-%d %H:%M')

def not_found():
    return render_template('404.html'), 404

def get_user_permissions(username):
    try:
        conn = sqlite3.connect('data.db')
        c = conn.cursor()
        c.execute("SELECT perm_create, perm_custom_alias, perm_expiry, perm_uses, perm_password, perm_redirect FROM users WHERE username=?", (username,))
        row = c.fetchone()
        conn.close()
        if row:
            return {
                'create': row[0],
                'custom_alias': row[1],
                'expiry': row[2],
                'uses': row[3],
                'password': row[4],
                'redirect': row[5]
            }
    except:
        pass
    return {}

@app.route("/dashboard", methods=["GET", "POST"])
@login_required
def index():
    check_time()
    
    # Get up-to-date permissions
    perms = get_user_permissions(session['username'])

    if request.method == "POST":
        # Check permissions
        # perms = session.get('permissions', {}) # Use DB instead
        if not perms.get('create', 0):
            flash('You do not have permission to create short links.', 'error')
            return redirect('/')

        #get parameters from the form
        url = request.form.get("url")
        expire = request.form.get("expire")
        password = request.form.get("pass")
        endpoint = request.form.get("path")

        # Permission checks
        if endpoint and not perms.get('custom_alias', 0):
            flash('You do not have permission to use custom aliases.', 'error')
            return redirect('/')
        
        if expire and not perms.get('expiry', 0):
            flash('You do not have permission to set expiry dates.', 'error')
            return redirect('/')
            
        if password and not perms.get('password', 0):
            flash('You do not have permission to password protect links.', 'error')
            return redirect('/')

        if request.form.get("maxUses"):
            if not perms.get('uses', 0):
                flash('You do not have permission to set max uses.', 'error')
                return redirect('/')
            uses = int(request.form.get("maxUses"))
        else:
            uses = -1
        
        try:
            if request.form['redirect']:
                if not perms.get('redirect', 0):
                    redirecting = False
                else:
                    redirecting = True
        except:
                redirecting = False

        if url:
            #validates/formats url
            if not validators.url(url):
                url = f'https://{url}'

            # Check if a custom endpoint was provided
            if endpoint:
                random_string = endpoint
            else:
                # Get a random string if no custom endpoint was provided
                random_string = generate_random_string()

            if expire:
                # expire_time = expire
                expire_time = convert_time_format(expire)
            else:
                expire_time = ""
            
            fetchUrl.add_url("/"+random_string, url, expire_time, password, redirecting, uses)

            #redirect to the index page
            return redirect('/')
        else:
            return redirect('/')
    else:
        #load existing data
        data = fetchUrl.load_data()
        
        #extract key, paths, URLs, expiry date and uses left from the data
        entries = [
            (
                k, 
                v["endpoint"], 
                v["url"], 
                "never" if not v["expiry"] else v["expiry"], 
                "unlimited" if v["uses"] < 0 else v["uses"],
                v["redirect"]
            ) 
                for k, v in data.items()
        ]
        return render_template("index.html", entries=entries, permissions=perms)

@app.route("/qr", methods=["POST"])
@login_required
def make_qr():
    # Get the data from the request
    index = request.form.get('index')
    endpoint = request.url_root[:-1] + index

    # Generate QR code with higher error correction level (ERROR_CORRECT_Q)
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,  # Increased error correction level
        box_size=10,
        border=2,
    )

    # Add the data to the QR code
    qr.add_data(endpoint)

    # Generate QR code image
    qr_img = qr.make_image(fill_color="black", back_color="white")

    # Create a transparent mask with the shape of the QR code
    qr_mask = Image.new('RGBA', qr_img.size, (255, 255, 255, 0))

    # Load the placeholder image
    placeholder_path = "static/img/placeholder.png"
    placeholder_img = Image.open(placeholder_path)

    # Get the size of the QR code image
    qr_width, qr_height = qr_img.size

    # Calculate the position to paste the placeholder image in the center of the QR code
    x_offset = (qr_width - placeholder_img.width) // 2
    y_offset = (qr_height - placeholder_img.height) // 2

    # Paste the placeholder image onto the transparent mask
    qr_mask.paste(placeholder_img, (x_offset, y_offset), placeholder_img)

    # Composite the QR code image and the transparent mask
    qr_img = Image.alpha_composite(qr_img.convert('RGBA'), qr_mask)

    # Convert the modified QR code image to a base64-encoded data URL
    img_buffer = io.BytesIO()
    qr_img = qr_img.convert('RGB')  # Convert back to RGB before saving
    qr_img.save(img_buffer, format="PNG")
    img_str = base64.b64encode(img_buffer.getvalue()).decode()
    data_url = "data:image/png;base64," + img_str

    # Fetch data
    entries = fetchUrl.load_data_from_endpoint(index)

    # Return the data URL and entries as JSON
    return jsonify({"qr_image": data_url, "about": entries})

#change endpoint
@app.route('/change_endpoint', methods=['GET', 'POST'])
@login_required
def change_endpoint():
    if request.method == 'POST':
        # Check permissions
        perms = get_user_permissions(session['username'])
        
        index = request.form['index']

        endpoint = request.form['new_endpoint']
        url = request.form['new_url']
        expiry = request.form['new_expiry']
        uses = request.form['uses']

        old_password = request.form['old_password']
        new_password = request.form['new_password']

        try:
            if request.form['new_redirect']:
                if not perms.get('redirect', 0):
                    redirecting = False
                else:
                    redirecting = True
        except:
                redirecting = False

        check = fetchUrl.load_data()
        
        # Validate custom endpoint permission
        if endpoint and endpoint != check[index]["endpoint"] and not perms.get('custom_alias', 0):
             # If user tries to change endpoint without permission
             endpoint = check[index]["endpoint"] # Revert to old

        if not new_password:
            new_password = check[index]["pass"]
        elif old_password and new_password:
            # Check password permission
            if not perms.get('password', 0):
                new_password = check[index]["pass"] # Revert
            else:
                old_password == check[index]["pass"]
        
        if expiry:
            if not perms.get('expiry', 0):
                expiry = check[index]["expiry"] # Revert
            else:
                expiry = convert_time_format(expiry)
        
        #formats endpoint if user has not already done so
        if endpoint:
            if not endpoint.startswith('/'):
                endpoint = '/'+ endpoint
        try:
            if int(uses):
                if not perms.get('uses', 0):
                     uses = check[index]["uses"] # Revert
                else:
                    uses = int(uses)
        except ValueError:
            uses = -1

        data = {
            "endpoint": endpoint,
            "url": url,
            "expiry": expiry,
            "pass": new_password,
            "redirect": redirecting,
            "uses": uses
        }

        if fetchUrl.change_endpoint(index, data):
            return redirect(url_for('index'))

        else:
            return "Index not found"
    return redirect('/')

#remove endpoint
@app.route('/remove_endpoint', methods=['GET', 'POST'])
@login_required
def remove_endpoint():
    if request.method == 'POST':
        index = request.form['index']

        if fetchUrl.remove_endpoint(index):
            return redirect(url_for('index'))
        else:
            return "Index not found"
    return render_template('remove_endpoint.html')

@app.route('/endpoint_details', methods=['GET', 'POST'])
@login_required
def endpoint_details():
    if request.method == 'POST':
        index = request.form['index']
        data = fetchUrl.load_data()
        if index in data:
            data = data[index]
            if data["redirect"]:
                data["redirect"] = 'on'
            else:
                data["redirect"] = 'off'
            print(data)
            return data
        return {}
    else:
        pass

# @app.route('/', defaults={'path': ''}, methods=['GET', 'POST'])
@app.route('/<path:path>', methods=['GET', 'POST'])
def redirect_url(path):
    endpoint = '/' + path if path else '/'
    uses = fetchUrl.find_endpoint_uses(endpoint)
    url = fetchUrl.find_endpoint(endpoint)
    expected_password = fetchUrl.find_endpoint_pass(endpoint)
    key = fetchUrl.find_key_by_endpoint(endpoint)

    if not url:
        return not_found()

    if not uses:
        fetchUrl.remove_endpoint(key)
        return not_found()

    # Log user access
    user_agent = request.headers.get('User-Agent')
    ip_address = request.remote_addr
    log_user_access(endpoint, user_agent)

    if not expected_password:
        if fetchUrl.redirect(endpoint):
            return redirect(f'/redirect?endpoint={endpoint}')
        else:
            if uses > 0:
                fetchUrl.change_uses(fetchUrl.find_key_by_endpoint(endpoint), (uses-1))
                if uses == 1:
                    fetchUrl.remove_endpoint(key)
            return redirect(url)

    if request.method == 'POST':
        # Get the password entered by the user
        provided_password = request.form.get('password')

        if provided_password == expected_password:
            # If the password is correct, redirect
            if uses > 0:
                fetchUrl.change_uses(fetchUrl.find_key_by_endpoint(endpoint), (uses-1))
                if uses == 1:
                    fetchUrl.remove_endpoint(key)
            return redirect(url)
        else:
            # If the password is incorrect, render the form again with an error message
            return render_template('auth.html', path=endpoint, error="Incorrect password. Please try again.")
    else:
        # Render the password input form
        return render_template('auth.html', path=endpoint)

@app.route('/redirect')
def redirect_page():
    endpoint = request.args.get('endpoint')
    url = fetchUrl.find_endpoint(endpoint)
    return render_template('redirect.html', url=url, wait=5000)

@app.route('/')
def home():
    if 'username' in session:
        return redirect(url_for('index'))
    return render_template('landing.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'GET':
        if 'username' in session:
            return redirect(url_for('index'))
        return render_template('login.html')
    
    username = request.form['username']
    password = request.form['password']

    try:
        conn = sqlite3.connect('data.db')
        c = conn.cursor()
        c.execute("SELECT password_hash, salt, user_group, perm_create, perm_custom_alias, perm_expiry, perm_uses, perm_password, perm_redirect FROM users WHERE username=?", (username,))
        user = c.fetchone()
        conn.close()

        if user:
            stored_hash = user[0]
            salt = base64.urlsafe_b64decode(user[1])
            group = user[2]

            if hash(password, salt) == stored_hash:
                session['username'] = username
                session['group'] = group
                session['permissions'] = {
                    'create': user[3],
                    'custom_alias': user[4],
                    'expiry': user[5],
                    'uses': user[6],
                    'password': user[7],
                    'redirect': user[8]
                }
                return redirect(url_for('index'))
            
    except Exception as e:
        print(f"Database error: {e}")

    flash('Invalid username or password. Please try again.')
    return render_template('login.html')


@app.route('/logout')
def logout():
    # Clear the session data
    session.pop('username', None)
    session.pop('group', None)

    # Redirect the user to the home or login page
    return redirect(url_for('home'))

@app.route('/admin-panel')
def admin_panel():
    # Check if the user is logged in and is an administrator
    if 'username' in session and 'group' in session:
        if session['group'] == 'administrator':
            return render_template('admin.html')  # Render admin panel for admins
        else:
            flash('You do not have permission to access the admin panel.')
            return redirect(url_for('index'))  # Redirect non-admins to the home page
    else:
        flash('You need to log in first.')
        return redirect(url_for('index'))  # Redirect to the home page if not logged in

# @app.route('/debug/add-user', methods=['GET', 'POST'])
# @login_required
# def debug_add_user():
#     if request.method == 'POST':
#         username = request.form.get('username')
#         password = request.form.get('password')
#         group = request.form.get('group')
#
#         if not username or not password or not group:
#             flash('All fields are required', 'danger')
#             return render_template('debug_add_user.html')
#
#         try:
#             conn = sqlite3.connect('data.db')
#             c = conn.cursor()
#             
#             # Check if user exists
#             c.execute("SELECT * FROM users WHERE username=?", (username,))
#             if c.fetchone():
#                 flash(f'User {username} already exists', 'danger')
#                 conn.close()
#                 return render_template('debug_add_user.html')
#
#             # Generate random salt (16 bytes)
#             salt = os.urandom(16)
#             password_hash = hash(password, salt)
#             
#             # Store salt as base64 string
#             salt_b64 = base64.urlsafe_b64encode(salt).decode('utf-8')
#             
#             c.execute("INSERT INTO users (username, password_hash, salt, user_group) VALUES (?, ?, ?, ?)",
#                       (username, password_hash, salt_b64, group))
#             conn.commit()
#             conn.close()
#             
#             flash(f'User {username} added successfully', 'success')
#             return render_template('debug_add_user.html')
#
#         except Exception as e:
#             flash(f'Error adding user: {e}', 'danger')
#             return render_template('debug_add_user.html')
#
#     return render_template('debug_add_user.html')

@app.route('/settings', methods=['GET', 'POST'])
@login_required
def settings():
    if request.method == 'POST':
        current_password = request.form.get('current_password')
        new_password = request.form.get('new_password')
        confirm_password = request.form.get('confirm_password')
        
        if not current_password or not new_password or not confirm_password:
            flash('All fields are required.', 'error')
            return redirect(url_for('index') + '#settings')
            
        if new_password != confirm_password:
            flash('New passwords do not match.', 'error')
            return redirect(url_for('index') + '#settings')
            
        username = session['username']
        
        try:
            conn = sqlite3.connect('data.db')
            c = conn.cursor()
            
            # Verify current password
            c.execute("SELECT password_hash, salt FROM users WHERE username=?", (username,))
            user = c.fetchone()
            
            if user:
                stored_hash = user[0]
                salt = base64.urlsafe_b64decode(user[1])
                
                if hash(current_password, salt) == stored_hash:
                    # Generate new salt and hash
                    new_salt = os.urandom(16)
                    new_hash = hash(new_password, new_salt)
                    new_salt_b64 = base64.urlsafe_b64encode(new_salt).decode('utf-8')
                    
                    # Update password
                    c.execute("UPDATE users SET password_hash=?, salt=? WHERE username=?", 
                             (new_hash, new_salt_b64, username))
                    conn.commit()
                    flash('Password updated successfully.', 'success')
                else:
                    flash('Incorrect current password.', 'error')
            else:
                flash('User not found.', 'error')
                 
            conn.close()
            
        except Exception as e:
            flash(f'Error updating password: {e}', 'error')
            
        return redirect(url_for('index') + '#settings')

    # If GET request, redirect to dashboard with settings view
    return redirect(url_for('index') + '#settings')


@app.route('/api/analytics')
@login_required
def analytics_data():
    # Load access log data
    log_file_path = os.path.join(script_directory, "access.log")
    if not os.path.exists(log_file_path):
        return jsonify({
            'mostUsedIPs': [],
            'mostUsedUserAgents': [],
            'requests': [],
            'chartLabels': [],
            'chartData': []
        })

    with open(log_file_path, 'r') as log_file:
        logs = log_file.readlines()

    ip_count = {}
    user_agent_count = {}
    device_count = {}
    requests_list = []

    for log in logs:
        parts = log.split(' - ')
        if len(parts) >= 4:
            # Support both old format (4 parts) and new format (5 parts with device type)
            timestamp = parts[0]
            ip = parts[1].replace('IP: ', '')
            endpoint = parts[2].replace('Endpoint: ', '')
            user_agent = parts[3].replace('User Agent: ', '').strip()
            
            device_type = 'Unknown'
            if len(parts) >= 5:
                device_type = parts[4].replace('Device: ', '').strip()
            
            requests_list.append({'timestamp': timestamp, 'ip': ip, 'agent': user_agent, 'endpoint': endpoint, 'device': device_type})

            if ip in ip_count:
                ip_count[ip] += 1
            else:
                ip_count[ip] = 1

            if user_agent in user_agent_count:
                user_agent_count[user_agent] += 1
            else:
                user_agent_count[user_agent] = 1
                
            if device_type in device_count:
                device_count[device_type] += 1
            else:
                device_count[device_type] = 1

    # Sort and get the most used IPs and User Agents
    most_used_ips = sorted(ip_count.items(), key=lambda x: x[1], reverse=True)[:5]
    most_used_user_agents = sorted(user_agent_count.items(), key=lambda x: x[1], reverse=True)[:5]
    
    # Prepare device chart data
    device_labels = list(device_count.keys())
    device_values = list(device_count.values())

    # Prepare data for the chart (requests per day/hour could be better, but let's stick to simple endpoint counts for now or agent based on previous code)
    # The previous code charted 'agent' which seems odd, let's chart 'endpoint' usage.
    chart_data = {}
    for req in requests_list:
        ep = req['endpoint']
        # Filter only for shortlink endpoints (starting with /) and excluding admin/static paths if possible
        # For now, just count all.
        if ep in chart_data:
            chart_data[ep] += 1
        else:
            chart_data[ep] = 1

    # Sort chart data by usage
    chart_data_sorted = dict(sorted(chart_data.items(), key=lambda item: item[1], reverse=True)[:10])

    chart_labels = list(chart_data_sorted.keys())
    chart_values = list(chart_data_sorted.values())

    return jsonify({
        'mostUsedIPs': [{'address': ip, 'count': count} for ip, count in most_used_ips],
        'mostUsedUserAgents': [{'agent': agent, 'count': count} for agent, count in most_used_user_agents],
        'requests': requests_list[-100:], # Return last 100 requests for the table
        'chartLabels': chart_labels,
        'chartData': chart_values,
        'deviceLabels': device_labels,
        'deviceData': device_values
    })

@app.route('/api/users', methods=['GET', 'POST'])
@login_required
def manage_users():
    if session.get('group') != 'administrator':
        return jsonify({'error': 'Unauthorized'}), 403

    conn = sqlite3.connect('data.db')
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    if request.method == 'GET':
        c.execute("SELECT id, username, user_group, perm_create, perm_custom_alias, perm_expiry, perm_uses, perm_password, perm_redirect FROM users")
        users = [dict(row) for row in c.fetchall()]
        conn.close()
        return jsonify(users)

    if request.method == 'POST':
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        group = data.get('group', 'user')
        
        # Permissions
        perms = data.get('permissions', {})
        # Default: Users get only create, Admins get all (handled by UI but good to have defaults)
        # If group is administrator, we might want to force all true?
        # The user said "allow the administrator to set each permission", so we trust the payload.
        
        p_create = 1 if perms.get('create') else 0
        p_custom = 1 if perms.get('custom_alias') else 0
        p_expiry = 1 if perms.get('expiry') else 0
        p_uses = 1 if perms.get('uses') else 0
        p_password = 1 if perms.get('password') else 0
        p_redirect = 1 if perms.get('redirect') else 0

        if not username or not password:
            conn.close()
            return jsonify({'error': 'Username and password required'}), 400

        # Check if exists
        c.execute("SELECT id FROM users WHERE username=?", (username,))
        if c.fetchone():
            conn.close()
            return jsonify({'error': 'User already exists'}), 409

        # Hash password
        salt = os.urandom(16)
        password_hash = hash(password, salt)
        salt_b64 = base64.urlsafe_b64encode(salt).decode('utf-8')

        try:
            c.execute('''INSERT INTO users 
                         (username, password_hash, salt, user_group, 
                          perm_create, perm_custom_alias, perm_expiry, perm_uses, perm_password, perm_redirect) 
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''',
                      (username, password_hash, salt_b64, group, 
                       p_create, p_custom, p_expiry, p_uses, p_password, p_redirect))
            conn.commit()
            conn.close()
            return jsonify({'success': True})
        except Exception as e:
            conn.close()
            return jsonify({'error': str(e)}), 500
            
    conn.close()
    return jsonify({'error': 'Method not allowed'}), 405

@app.route('/api/users/<int:user_id>', methods=['DELETE', 'PUT'])
@login_required
def user_operations(user_id):
    if session.get('group') != 'administrator':
        return jsonify({'error': 'Unauthorized'}), 403

    conn = sqlite3.connect('data.db')
    c = conn.cursor()

    if request.method == 'DELETE':
        # Prevent deleting yourself
        c.execute("SELECT username FROM users WHERE id=?", (user_id,))
        row = c.fetchone()
        
        if not row:
             conn.close()
             return jsonify({'error': 'User not found'}), 404
             
        if row[0] == session['username']:
            conn.close()
            return jsonify({'error': 'Cannot delete yourself'}), 400

        c.execute("DELETE FROM users WHERE id=?", (user_id,))
        conn.commit()
        conn.close()
        return jsonify({'success': True})

    if request.method == 'PUT':
        data = request.get_json()
        password = data.get('password')
        group = data.get('group')
        perms = data.get('permissions')

        updates = []
        params = []

        if password:
             salt = os.urandom(16)
             password_hash = hash(password, salt)
             salt_b64 = base64.urlsafe_b64encode(salt).decode('utf-8')
             updates.append("password_hash=?")
             updates.append("salt=?")
             params.append(password_hash)
             params.append(salt_b64)
        
        if group:
            updates.append("user_group=?")
            params.append(group)

        if perms:
            # Map frontend permission names to DB columns
            perm_map = {
                'create': 'perm_create',
                'custom_alias': 'perm_custom_alias',
                'expiry': 'perm_expiry',
                'uses': 'perm_uses',
                'password': 'perm_password',
                'redirect': 'perm_redirect'
            }
            
            for key, db_col in perm_map.items():
                if key in perms:
                    updates.append(f"{db_col}=?")
                    params.append(1 if perms[key] else 0)

        if not updates:
            conn.close()
            return jsonify({'success': True}) # Nothing to update

        query = f"UPDATE users SET {', '.join(updates)} WHERE id=?"
        params.append(user_id)
        
        try:
            c.execute(query, tuple(params))
            conn.commit()
            conn.close()
            return jsonify({'success': True})
        except Exception as e:
            conn.close()
            return jsonify({'error': str(e)}), 500
            
    conn.close()
    return jsonify({'error': 'Method not allowed'}), 405



if __name__ == '__main__':
    app.run(debug=True, host="0.0.0.0", port="7237")
    # serve(app, host="0.0.0.0", port="7237")
