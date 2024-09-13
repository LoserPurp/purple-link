
function getEndpointData(index) {
    const formData = new FormData();
    formData.append('index', index);

    return fetch('/endpoint_details', {
        method: 'POST',
        body: formData,
        headers: {
            'Accept': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => data)
    .catch(error => {
        console.error('Error:', error);
    });
}

function copyEndpoint(index) {
    const endpoint = document.getElementById("endpoint" + index).href;
    navigator.clipboard.writeText(endpoint);
}


//Flips element from hidden to visible
function setExpiry() {
    var expiryElement = document.getElementById("expiry");
    var buttonUrlContainer = document.getElementById("buttonUrlContainer");

    expiryElement.style.bottom = (expiryElement.style.bottom === "0px") ? "355px" : "0px";
    buttonUrlContainer.style.bottom = (buttonUrlContainer.style.bottom === "0px") ? "305px" : "0px";
}


function editEndpoint(index) {
    document.getElementById("qrInfo").style.display = "none"
    document.getElementById("infoBox").style.display = 'flex'

    //Flips element from hidden to visible
    document.getElementById("changeEndpointContainer").hidden = false
    document.getElementById("index").value = index

    //Saves the endpoint data av a variable and changes the value of the coresponding feelds
    getEndpointData(index).then(endpointData => {
        function changeData(id, value) {
            if (id == "new_expiry" && document.getElementById(id).value == "" || id == "new_expiry" && document.getElementById(id).value != "") { 
                document.getElementById(id).value = value
            }
            else if (id != "new_redirect") {
                document.getElementById(id).value = value
                // updatePlaceHolder(id)
            }
            else if (value == 'on') {
                document.getElementById("new_redirect").checked = true
                buttonNoAnimation()
            }
            else if (value == 'off') {
                document.getElementById("new_redirect").checked = false
                buttonNoAnimation()
            }
        }
    //checks if entry is empty and updates the values
    for (key in endpointData) {
        if (endpointData[key]) {
            id = "new_"+key
            changeData(id, endpointData[key])
        }
    }
    })

    var passwordContainer = document.querySelector("#changeEndpointContainer > form > div.passwordContainerSidebySide");
    passwordContainer.style.display = "none";
    var buttonUrlContainer = document.querySelector("#showPasswordButton");
    buttonUrlContainer.style.display = "flex";
    
    function buttonNoAnimation() {
        const style = document.createElement('style');
        style.innerHTML = `
        .checkbox-wrapper-6 .tgl:checked + .tgl-btn:after,
        .checkbox-wrapper-6 .tgl-light + .tgl-btn:after,
        .checkbox-wrapper-6 .tgl-light + .tgl-btn {
            transition: none !important;
        }
        `;
        document.head.appendChild(style);
    
        setTimeout(() => {
            style.remove();
        }, 1);
    }
}


document.addEventListener('DOMContentLoaded', () => {

    const excludedInputIds = ['expire', 'new_expiry'];
    const allInputs = document.querySelectorAll('input');

    allInputs.forEach(input => {
        const { id: inputId, value, dataset } = input;

        if (excludedInputIds.includes(inputId)) return;

        // Option A: Using data-placeholder attribute
        const placeholderId = dataset.placeholder;
        // Option B: Using a naming convention
        // const placeholderId = `${inputId}placeholder`;

        if (!placeholderId) {
            // console.warn(`No placeholder ID found for input "${inputId}".`);
            return;
        }

        const placeholder = document.getElementById(placeholderId);
        if (!placeholder) {
            console.warn(`Placeholder element "${placeholderId}" not found.`);
            return;
        }

        const hideShow = document.getElementById(`hideShow${inputId}`);

        const toggleClasses = () => {
            const hasValue = input.value.trim() !== "";
            const isFocused = document.activeElement === input;
            placeholder.classList.toggle('placeholderWithText', hasValue || isFocused);
            if (hideShow) hideShow.classList.toggle('hideShowFocused', hasValue || isFocused);
            if (inputId === 'password') {
                document.querySelector("#hideShowpassword").style.bottom = hasValue || isFocused ? "2px" : "3px";
            }
        };

        // Initialize state
        toggleClasses();

        // Event listeners
        input.addEventListener('input', toggleClasses);
        input.addEventListener('focus', () => {
            placeholder.classList.add('placeholderWithText');
            if (hideShow) hideShow.classList.add('hideShowFocused');
            if (inputId === 'password') {
                document.querySelector("#hideShowpassword").style.bottom = "2px";
            }
        });
        input.addEventListener('blur', toggleClasses);

        // Detect programmatic value changes
        const originalValueDescriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
        Object.defineProperty(input, 'value', {
            get() {
                return originalValueDescriptor.get.call(this);
            },
            set(val) {
                originalValueDescriptor.set.call(this, val);
                toggleClasses();
            }
        });
    });



    //Info box
    var infoBox = document.getElementById("infoBox");
    var boxBox = document.querySelector(".boxBox");
    var endpointList = document.getElementById("endpointList");

        document.addEventListener('click', (event) => {
            try {
                if (!boxBox.contains(event.target) && !endpointList.contains(event.target)) {
                    infoBox.style.display = "none";
                }
            } catch (error) {}
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                infoBox.style.display = "none";
            }
        });

    //Flash message
    try {
        const flashMessage = document.querySelector("body > div.flashMessage");
        if (flashMessage) {
            if (flashMessage.style.opacity === '1') {
                clearTimeout(flashMessage.timeoutId);
            }
            flashMessage.style.opacity = '1';
            flashMessage.timeoutId = setTimeout(() => flashMessage.style.opacity = '0', 3000);
        }
    } catch (error) {}

});
function downloadQr() {
    var image = document.getElementById("qrCode");
    var downloadLink = document.createElement("a");
    downloadLink.href = image.src;
    downloadLink.download = "qrcode.jpg";
    downloadLink.click();
}

function showPassword(){
    var passwordContainer = document.querySelector("#changeEndpointContainer > form > div.passwordContainerSidebySide");
    passwordContainer.style.display = "flex";
    var buttonUrlContainer = document.querySelector("#showPasswordButton");
    buttonUrlContainer.style.display = "none";
}

window.onload = function() {
    var links = document.querySelectorAll('a.urlEndpoint');
    var maxWidth = 0;

    links.forEach(function(link) {
        var linkWidth = link.offsetWidth;
        if (linkWidth > maxWidth && linkWidth <= 120) {
            maxWidth = linkWidth;
        } else if (linkWidth > 120) {
            maxWidth = 120; // Set maxWidth to 120 if the link width exceeds 120 pixels
        }
    });

    // Add 10 extra pixels to the maxWidth if it's less than or equal to 110 pixels
    if (maxWidth <= 110) {
        maxWidth += 15;
    }

    links.forEach(function(link) {
        link.style.minWidth = maxWidth + 'px';
        link.style.maxWidth = maxWidth + 'px'; // Set max-width same as min-width
    });

    function dateFormat() {
        const dateFormat = "HH:mm DD.MM.YYYY".replace(/\./g, "/");
        const dateElements = document.querySelectorAll("#endpointList > div > div > div:nth-child(3) > a");

        dateElements.forEach(dateElement => {
            let dateText = dateElement.textContent.trim();
            if (dateText.toLowerCase() === "never") return;

            let [datePart, timePart] = dateText.split(' ');
            let originalDate = new Date(datePart + 'T' + timePart);

            let formattedDate = dateFormat
                .replace("DD", originalDate.getDate().toString().padStart(2, '0'))
                .replace("MM", (originalDate.getMonth() + 1).toString().padStart(2, '0'))
                .replace("YYYY", originalDate.getFullYear())
                .replace("HH", originalDate.getHours().toString().padStart(2, '0'))
                .replace("mm", originalDate.getMinutes().toString().padStart(2, '0'));

            dateElement.textContent = formattedDate;
        });
    }
    dateFormat();

};


var isPasswordVisible = false;

function togglePassword(input) {


    var hideshow = document.querySelector("#hideShow"+input)
      var passwordInput = document.getElementById(input);
        
      isPasswordVisible = !isPasswordVisible;
    
      if (isPasswordVisible) {
        passwordInput.type = 'text';
        hideshow.innerHTML = "Hide"
        hideshow.classList.add('hideShowUnder')
      } else {
        passwordInput.type = 'password';
        hideshow.innerHTML = "Show"
        hideshow.classList.remove('hideShowUnder')
      }
    }





function showSomething(getName) {
    try {
        const container = document.getElementById('endpointList');
        container.innerHTML = '';  // Clear the container
        
        if (getName) {
        // First fetch and insert HTML
        fetch('/settings/'+getName)
            .then(response => response.text())
            .then(html => {
                // Once the fetch is complete and HTML is loaded into the DOM
                const newDiv = document.createElement('div');
                newDiv.innerHTML = html;
                container.appendChild(newDiv);
                // Test Code. This adds a new element to the fetched HTML
                const otherContainer = document.querySelector("#settingsContent");
                if (otherContainer) {
                    const anotherDiv = document.createElement('div');
                    const newHeading = document.querySelector("#SettingsLabel");
                    newHeading.textContent = getName.charAt(0).toUpperCase() + getName.slice(1).toLowerCase();
                    otherContainer.appendChild(anotherDiv);
                } else {
                    console.error('Element #settingsContent not found');
                }
            })
            .catch(error => {
                console.error('Error loading the head:', error);
            });
        }
    } catch (error) {
        console.error(error);
    }
}



//XMLHttps request for removing entry a in the json file
function removeEndpoint(index) {
    fetch('/remove_endpoint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'index=' + encodeURIComponent(index)
    })
    .then(response => {
        if (!response.ok) throw new Error('Request failed with status: ' + response.status);
        window.location.href = '/';
    })
    .catch(error => {
        console.error('Request failed:', error);
        alert('Error: Index not found');
    });
}

//requests a qr-code and displays it
function makeQR(index) {
    const elementsToUpdate = {
        qrInfo: "flex",
        changeEndpointContainer: true,
        infoBox: "flex"
    };

    Object.keys(elementsToUpdate).forEach(id => {
        const element = document.getElementById(id);
        if (id === "changeEndpointContainer") {
            element.hidden = elementsToUpdate[id];
        } else {
            element.style.display = elementsToUpdate[id];
        }
    });

    fetch('/qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'index=' + encodeURIComponent(index)
    })
    .then(response => {
        if (!response.ok) throw new Error('Request failed with status: ' + response.status);
        return response.json();
    })
    .then(response => {
        const { qr_image, about } = response;
        const { endpoint, url, expiry, pass, uses } = about[0];
        document.getElementById("qrCode").src = qr_image;
        document.getElementById("endpointPath").innerHTML = endpoint;
        document.getElementById("endpointPath").href = endpoint;
        document.getElementById("orgUrl").innerHTML = url;
        document.getElementById("orgUrl").href = url;
        document.getElementById("endpointExpiry").innerHTML = expiry;
        document.getElementById("endpointPass").innerHTML = pass;
        document.getElementById("endpointUses").innerHTML = uses;
    })
    .catch(error => {
        console.error(error);
        alert('Error: Index not found');
    });
}
