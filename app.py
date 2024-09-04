from flask import Flask, jsonify, redirect, request, url_for, render_template
from waitress import serve
from datetime import datetime, timedelta
import fetchUrl
import json
import random
import string
import threading
import time
import qrcode
import io
import base64
import validators

from PIL import Image


app = Flask(__name__)


#makes random string
def generate_random_string():
    while True:
        rndm = ''.join(random.choices(string.ascii_letters, k=5))
        if not fetchUrl.find_endpoint(rndm):
            return rndm



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



def add_time(hours):
    current_time = datetime.now()

    # Add 24 hours to the current time
    delta = timedelta(hours=hours)
    updated_time = current_time + delta

    # Convert the updated time to string and remove seconds and microseconds
    current_time = updated_time.strftime("%Y-%m-%d %H:%M")

    return current_time



def not_found():
    return render_template('404.html'), 404



@app.route("/", methods=["GET", "POST"])
def index():
    check_time()

    if request.method == "POST":
        #get parameters from the form
        url = request.form.get("url")
        expire = request.form.get("expire")
        password = request.form.get("pass")

        if request.form.get("maxUses"):
            uses = int(request.form.get("maxUses"))
        else:
            uses = -1

        if url:
            #validates/formats url
            if not validators.url(url):
                url = f'https://{url}'

            #get random string
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
                expire_time = add_time(int(expire))
                #add random string, URL and expiration date to data
                data[i] = {f"endpoint": "/"+random_string,"url": url,"expiry": expire_time, "pass": password, "redirect": False, "uses": uses}
            else:
                
                #add random string and URL to data
                data[i] = {f"endpoint": "/"+random_string,"url": url,"expiry": "", "pass": password, "redirect": False, "uses": uses}
            
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
                "unlimited" if v["uses"] < 0 else v["uses"]
            ) 
                for k, v in data.items()
        ]
        return render_template("index.html", entries=entries)



@app.route("/qr", methods=["POST"])
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
def change_endpoint():
    if request.method == 'POST':
        index = request.form['index']
        endpoint = request.form['endpoint']
        #formats endpoint if user has not already done so
        if endpoint:
            if not endpoint.startswith('/'):
                endpoint = '/'+ endpoint
            
            if fetchUrl.change_endpoint(index, endpoint):
                return redirect(url_for('index'))

            else:
                return "Index not found"
    return redirect('/')


#remove endpoint
@app.route('/remove_endpoint', methods=['GET', 'POST'])
def remove_endpoint():
    if request.method == 'POST':
        index = request.form['index']
        
        if fetchUrl.remove_endpoint(index):
            return redirect(url_for('index'))
        else:
            return "Index not found"
    return render_template('remove_endpoint.html')


@app.route('/', defaults={'path': ''}, methods=['GET', 'POST'])
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


if __name__ == '__main__':
    app.run(debug=True, host="0.0.0.0", port="7237")
    # serve(app, host="0.0.0.0", port="7237")
