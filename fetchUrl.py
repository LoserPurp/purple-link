import json


#find the url in the list file from the given endpoint
def find_endpoint(endpoint_path):
    with open('urls.json', 'r') as file:
        list = json.load(file)
    for value in list.values():
        if value['endpoint'] == endpoint_path:
            return value['url']
    return None


#finds endpoint password in the list file from the given endpoint
def find_endpoint_pass(endpoint_path):
    with open('urls.json', 'r') as file:
        list = json.load(file)
    try:
        for value in list.values():
            if value['endpoint'] == endpoint_path:
                if value['pass']:
                    return value['pass']
    except:
        return False
    

#find the max amount of uses for given endpoint
def find_endpoint_uses(endpoint_path):
    with open('urls.json', 'r') as file:
        list = json.load(file)
    try:
        for value in list.values():
            if value['endpoint'] == endpoint_path:
                if value['uses']:
                    return int(value['uses'])
    except:
        return False
    
#find the max amount of uses for given endpoint
def redirect(endpoint_path):
    with open('urls.json', 'r') as file:
        list = json.load(file)
    try:
        for value in list.values():
            if value['endpoint'] == endpoint_path:
                return value['redirect']
    except:
        return False


#load existing data
def load_data():
    try:
        with open("urls.json", "r") as file:
            data = json.load(file)
    except FileNotFoundError:
        data = {}
    return data


#save data to json
def save_data(data):
    with open("urls.json", "w") as file:
        json.dump(data, file, indent=4)


#changes the random endpoint to a selected
def change_endpoint(index, endpoint):
    with open('urls.json', 'r') as file:
        data = json.load(file)
        if str(index) in data:
            data[str(index)]['endpoint'] = endpoint
            with open('urls.json', 'w') as file:
                json.dump(data, file, indent=4)
            return True
        return False


#removes selceted endpoint from json file
def remove_endpoint(index):
    with open('urls.json', 'r') as file:
        data = json.load(file)
        if str(index) in data:
            del data[str(index)]
            with open('urls.json', 'w') as file:
                json.dump(data, file, indent=4)
            return True
        return False
    
def find_key_by_endpoint(endpoint):
    with open('urls.json', 'r') as file:
        data = json.load(file)
    for key, value in data.items():
        if value.get('endpoint') == endpoint:
            return key
    return None