from flask import Flask, render_template, request, flash, redirect, url_for, session, jsonify
from waitress import serve
from functools import wraps
from datetime import datetime, timedelta
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes
from cryptography.fernet import Fernet
import fetchUrl
import json
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
import requests  # Add this import at the top

app = Flask(__name__)
app.secret_key = 'key69'

# Check if urls.json exists
url_check = 'urls.json'

# Get the absolute path of the current script directory
script_directory = os.path.dirname(os.path.abspath(__file__))
file_path = os.path.join(script_directory, url_check)
# Check if the file exists
if not os.path.isfile(file_path):
    with open(file_path, 'w') as file:
        json.dump({}, file) 

# Log user access
def log_user_access(endpoint, user_agent):
    try:
        ip_address = requests.get('https://ip.olayzen.net').text.strip()
    except requests.RequestException:
        ip_address = 'Unknown'  # Fallback if the request fails

    log_entry = f"{datetime.now().strftime('%Y-%m-%d %H:%M:%S')} - IP: {ip_address} - Endpoint: {endpoint} - User Agent: {user_agent}\n"
    log_file_path = os.path.join(script_directory, "access.log")  # Change to .log file

    # Append log entry to the log file
    with open(log_file_path, 'a') as log_file:
        log_file.write(log_entry)

#makes random string
def generate_random_string():
    while True:
        rndm = ''.join(random.choices(string.ascii_letters, k=5))
        if not fetchUrl.find_endpoint(rndm):
            return rndm

try:
    file_path = os.path.join(script_directory, "config.json")
    with open("config.json", "r") as file:
        conf = json.load(file)
except:
    print("config file not found")
    exit(1)

def hash(passphrase, salt="salt123!".encode(), iterations=100000):
    passphrase_bytes = passphrase.encode('utf-8')
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=iterations
    )
    derived_key = kdf.derive(passphrase_bytes)

    return base64.urlsafe_b64encode(derived_key).decode('utf-8')

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

@app.route("/dashboard", methods=["GET", "POST"])
@login_required
def index():
    check_time()

    if request.method == "POST":
        #get parameters from the form
        url = request.form.get("url")
        expire = request.form.get("expire")
        password = request.form.get("pass")
        endpoint = request.form.get("path")

        if request.form.get("maxUses"):
            uses = int(request.form.get("maxUses"))
        else:
            uses = -1
        
        try:
            if request.form['redirect']:
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

            #load existing data
            data = fetchUrl.load_data()

            #checks if a key already exists before making a new one
            i = 1
            while True:
                if str(i) not in data.keys():
                    break
                else:
                    i += 1

            if expire:
                # expire_time = expire
                expire_time = convert_time_format(expire)
                #add random string, URL and expiration date to data
                data[i] = {f"endpoint": "/"+random_string,"url": url,"expiry": expire_time, "pass": password, "redirect": redirecting, "uses": uses}
            else:
                
                #add random string and URL to data
                data[i] = {f"endpoint": "/"+random_string,"url": url,"expiry": "", "pass": password, "redirect": redirecting, "uses": uses}

            #save updated data
            fetchUrl.save_data(data)

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
        return render_template("index.html", entries=entries)

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
        index = request.form['index']

        endpoint = request.form['new_endpoint']
        url = request.form['url']
        expiry = request.form['expiry']
        uses = request.form['uses']

        old_password = request.form['passwordOld']
        new_password = request.form['password']

        try:
            if request.form['new_redirect']:
                redirecting = True
        except:
                redirecting = False

        check = fetchUrl.load_data()

        if not new_password:
            new_password = check[index]["pass"]
        elif old_password and new_password:
            old_password == check[index]["pass"]
        
        if expiry:
            expiry = convert_time_format(expiry)

        #formats endpoint if user has not already done so
        if endpoint:
            if not endpoint.startswith('/'):
                endpoint = '/'+ endpoint
        try:
            if int(uses):
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
        with open("urls.json", "r") as file:
            data = json.load(file)
            data = data[index]
            if data["redirect"]:
                data["redirect"] = 'on'
            else:
                data["redirect"] = 'off'
            print(data)
            return data
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
    return render_template('login.html')

@app.route('/login', methods=['POST'])
def login():
    username = request.form['username']
    password = request.form['password']

    try:
        with open("users.json", "r") as file:
            users = json.load(file)
    except:
        print("users file not found")
        exit(1)

    # Check if user exists and password is correct
    if username in users and users[username]["password"] == password:
        session['username'] = username
        session['group'] = users[username]["group"]
        return redirect(url_for('index'))
    else:
        flash('Invalid username or password. Please try again.')
        return render_template('login.html')

@app.route('/settings', methods=['GET', 'POST'])
def settings():
    if 'username' in session:
        if request.method == 'POST':
            theme = request.form['theme']
            session['theme'] = theme
            return redirect(url_for('settings'))
        current_theme = session.get('theme', 'automatic')
        return render_template('settings.html', current_theme=current_theme)
    return redirect(url_for('login'))

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

@app.route('/admin/data')
@login_required
def admin_data():
    # Load access log data
    log_file_path = os.path.join(script_directory, "access.log")
    with open(log_file_path, 'r') as log_file:
        logs = log_file.readlines()

    ip_count = {}
    user_agent_count = {}
    requests = []

    for log in logs:
        parts = log.split(' - ')
        if len(parts) >= 4:
            timestamp, ip, endpoint, user_agent = parts[0], parts[1], parts[2], parts[3].strip()
            requests.append({'timestamp': timestamp, 'ip': ip, 'agent': user_agent})

            if ip in ip_count:
                ip_count[ip] += 1
            else:
                ip_count[ip] = 1

            if user_agent in user_agent_count:
                user_agent_count[user_agent] += 1
            else:
                user_agent_count[user_agent] = 1

    # Sort and get the most used IPs and User Agents
    most_used_ips = sorted(ip_count.items(), key=lambda x: x[1], reverse=True)[:5]
    most_used_user_agents = sorted(user_agent_count.items(), key=lambda x: x[1], reverse=True)[:5]

    # Prepare data for the chart
    chart_data = {}
    for request in requests:
        endpoint = request['agent']  # Change this to the correct key if needed
        if endpoint in chart_data:
            chart_data[endpoint] += 1
        else:
            chart_data[endpoint] = 1

    chart_labels = list(chart_data.keys())
    chart_values = list(chart_data.values())

    return jsonify({
        'mostUsedIPs': [{'address': ip, 'count': count} for ip, count in most_used_ips],
        'mostUsedUserAgents': [{'agent': agent, 'count': count} for agent, count in most_used_user_agents],
        'requests': requests,
        'chartLabels': chart_labels,
        'chartData': chart_values
    })

@app.route('/settings/users')
@login_required
def load_users():
    return render_template('/settings-pages/users.html')

@app.route('/settings/account')
@login_required
def load_accounts():
    return render_template('/settings-pages/account.html')

@app.route('/settings/settings')
@login_required
def load_settings():
    return render_template('/settings-pages/settings.html')

if __name__ == '__main__':
    app.run(debug=True, host="0.0.0.0", port="7237")
    # serve(app, host="0.0.0.0", port="7237")
