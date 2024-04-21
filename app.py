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
            given_time = datetime.strptime(given_time_str, "%Y-%m-%d %H:%M:%S.%f")

            #check if current time is after the expiration
            if current_time > given_time:
                fetchUrl.remove_endpoint(key)
                print(entry[0] + " Removed")



def add_time(hours):
    current_time = datetime.now()

    # Add 24 hours to the current time
    delta = timedelta(hours=hours)
    updated_time = current_time + delta

    # Save the current time as a string
    current_time = str(updated_time)
    return current_time



def not_found():
    return render_template('404.html'), 404



@app.route("/", methods=["GET", "POST"])
def index():
    # check_time()

    if request.method == "POST":
        # Get URL from the form
        url = request.form.get("url")
        expire = request.form.get("expire")

        if request.form.get("maxUses"):
            uses = request.form.get("maxUses")
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
                data[i] = {f"endpoint": "/"+random_string,"url": url,"expiry": expire_time, "pass": "", "redirect": False, "uses": uses}
            else:
                
                #add random string and URL to data
                data[i] = {f"endpoint": "/"+random_string,"url": url,"expiry": "", "pass": "", "redirect": False, "uses": uses}
            
            #save updated data
            fetchUrl.save_data(data)
            
            #redirect to the index page
            return redirect('/')
        else:
            return redirect('/')
    else:
        #load existing data
        data = fetchUrl.load_data()
        
        #extract key, paths and URLs from the data
        entries = [(k, v["endpoint"], v["url"]) for k, v in data.items()]
        return render_template("index.html", entries=entries)


@app.route("/qr", methods=["POST"])
def make_qr():
    # Get the data from the request
    index = request.url_root[:-1] + request.form.get('index')

    # Generate QR code
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=2,
    )

    # Add the data to the QR code
    qr.add_data(index)
    qr.make(fit=True)

    # Create an in-memory buffer to store the image
    img_buffer = io.BytesIO()
    img = qr.make_image(fill_color="black", back_color="white")
    img.save(img_buffer, format='PNG')

    # Move the buffer pointer to the beginning
    img_buffer.seek(0)

    # Encode the image buffer as a base64 string
    img_str = base64.b64encode(img_buffer.getvalue()).decode()

    # Construct the data URL for embedding in HTML
    data_url = "data:image/png;base64," + img_str

    # Return the data URL as JSON
    return jsonify({"qr_image": data_url})


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

    if not url:
        return not_found()

    if not uses:
        key = fetchUrl.find_key_by_endpoint(endpoint)
        fetchUrl.remove_endpoint(key)
        return not_found()

    if not expected_password:
        if fetchUrl.redirect(endpoint):
            return redirect(f'/redirect?endpoint={endpoint}')
        else:
            return redirect(url)


    if request.method == 'POST':
        # Get the password entered by the user
        provided_password = request.form.get('password')
        
        
        if provided_password == expected_password:
            # If the password is correct, redirect
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

#!!working code do NOT remove!! 

# @app.route('/', defaults={'path': ''})
# @app.route('/<path:path>')
# def redirect_url(path):
#     #construct the endpoint path
#     endpoint_path = '/' + path if path else '/'
#     url = fetchUrl.find_endpoint(endpoint_path)

#     url_pass = fetchUrl.find_endpoint_pass(endpoint_path)

#     if url:
#         if not url_pass:
#             return redirect(url)
#         else:
#             return not_found()
#     else:
#         #return an error message if the endpoint path is not found in the list
#         return not_found()



if __name__ == '__main__':
    app.run(debug=True, host="0.0.0.0", port="7237")
    # serve(app, host="0.0.0.0", port="7237")