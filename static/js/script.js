let qxf

window.onload = function() {
    shortenURL()
}


//XMLHttps request for removing entry a in the json file
function removeEndpoint(index) {
    var xhr = new XMLHttpRequest();

    xhr.onload = function () {
        //check if request was successful
        if (xhr.status >= 200 && xhr.status < 300) {
            //redirect to index page
            window.location.href = '/';
        } else {
            //display error
            console.error('Request failed with status:', xhr.status);
            alert('Error: Index not found');
        }
    };

    //make the request
    xhr.open('POST', '/remove_endpoint', true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');

    //send the request
    xhr.send('index=' + encodeURIComponent(index));
}

//requests a qr-code and displays it
function makeQR(index) {
    //hides old info in box and shows new info
    document.getElementById("qrInfo").style.display = "flex"
    document.getElementById("changeEndpointContainer").hidden = true

    //makes qr code box visible
    document.getElementById("infoBox").style.display = 'flex'
    
    var xhr = new XMLHttpRequest();

    xhr.onload = function () {
        // Check if request was successful
        if (xhr.status >= 200 && xhr.status < 300) {
            // Parse response JSON
            var response = JSON.parse(xhr.responseText);

            // Create image element
            var img = document.createElement('img');
            img.src = response.qr_image;

            // Append image to the body or any other container
            document.getElementById("qrCode").src = img.src;
            
            
            document.getElementById("endpointPath").innerHTML = response.about[0].endpoint;
            document.getElementById("endpointPath").href = response.about[0].endpoint;
            document.getElementById("orgUrl").innerHTML = response.about[0].url;
            document.getElementById("orgUrl").href = response.about[0].url;
            document.getElementById("endpointExpiry").innerHTML = response.about[0].expiry;
            document.getElementById("endpointPass").innerHTML = response.about[0].pass;
            document.getElementById("endpointUses").innerHTML = response.about[0].uses;


        } else {
            // Display error
            console.error('Request failed with status:', xhr.status);
            alert('Error: Index not found');
        }
    };

    // Make the request
    xhr.open('POST', '/qr', true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');

    // Send the request
    xhr.send('index=' + encodeURIComponent(index));
}



function copyEndpoint(index) {
    //gets endpoint
    endpoint = document.getElementById("endpoint"+index).href;

    //creates temporary input element
    var tempInput = document.createElement("input");

    //creates link with current selections values
    tempInput.value = endpoint;

    //creates element and deletes it after copying
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand("copy");
    document.body.removeChild(tempInput);
}


//Flips element from hidden to visible
function setExpiry() {
    var expiryElement = document.getElementById("expiry");
    var buttonUrlContainer = document.getElementById("buttonUrlContainer");

    // Toggle for #expiry
    if (expiryElement.style.bottom === "0px") {
        expiryElement.style.bottom = "355px";  // Move it down (hide it)
    } else {
        expiryElement.style.bottom = "0px";  // Move it up (show it)
    }

    // Toggle for .buttonUrlContainer
    if (buttonUrlContainer.style.bottom === "0px") {
        buttonUrlContainer.style.bottom = "305px";  // Move it down (hide it)
    } else {
        buttonUrlContainer.style.bottom = "0px";  // Move it up (show it)
    }
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
                updatePlaceHolder(id)
            }
            else if (value == 'on') {
                console.log(id, value)
                document.getElementById("new_redirect").checked = true
                buttonNoAnimation()
            }
            else if (value == 'off') {
                console.log(id, value)
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
        const buttonstyle = document.createElement('style');

        buttonstyle.innerHTML = `
        .checkbox-wrapper-6 .tgl:checked + .tgl-btn:after {
            transition: none !important;
        }
        .checkbox-wrapper-6 .tgl-light + .tgl-btn:after{ 
            transition: none !important;
        }
        .checkbox-wrapper-6 .tgl-light + .tgl-btn{
            transition: none !important;
        }
        `;
        // Append the style element to the document head
        document.head.appendChild(buttonstyle);
        setTimeout(() => {

            buttonstyle.innerHTML = `
            .checkbox-wrapper-6 .tgl:checked + .tgl-btn:after {
                transition: all 0.2s ease !important;
            }
            .checkbox-wrapper-6 .tgl-light + .tgl-btn:after{ 
                transition: all 0.2s ease !important;
            }
            .checkbox-wrapper-6 .tgl-light + .tgl-btn{
                transition: all 0.4s ease !important;
            }
            `;
            // Append the style element to the document head
            document.head.appendChild(buttonstyle);

          }, 1);
    }

}


async function getEndpointData(index) {
    const formData = new FormData();
    formData.append('index', index);

    try {
        const response = await fetch('/endpoint_details', {
            method: 'POST',
            body: formData
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error:', error);
    }
}

document.addEventListener("DOMContentLoaded", function() {


    // Get the elements
    var infoBox = document.getElementById("infoBox");
    var boxBox = document.querySelector(".boxBox");
    var endpointList = document.getElementById("endpointList");

        // Function to handle clicks
        // Listen for both click outside and 'Esc' key events
        document.addEventListener('click', handleClickOutside);
        document.addEventListener('keydown', handleKeyPress);

        function handleClickOutside(event) {

            try {
                // Check if the clicked element is outside of the boxBox
                if (!boxBox.contains(event.target) && !endpointList.contains(event.target)) {
                    // If it's outside, hide the infoBox
                    infoBox.style.display = "none";
                }
                
            } catch (error) {
                
            }

        }


        function handleKeyPress(event) {
            // Check if the 'Esc' key was pressed
            if (event.key === 'Escape') {
                // Hide the infoBox when 'Esc' is pressed
                infoBox.style.display = "none";
            }
        }        

    // Add click event listener to the document
    document.addEventListener("click", handleClickOutside);

    try {
        const flashMessage = document.querySelector("body > div.flashMessage");
        if (flashMessage) {
            flashMessage.style.opacity = '1'; // Start fading out the entire flashMessage container
        }
        setTimeout(() => {
            if (flashMessage) {
                flashMessage.style.opacity = '0'; // Start fading out the entire flashMessage container
            }
        }, 3000); // Wait for 3 seconds before starting the fade-out

    } catch (error) {
        
    }

});

function downloadQr() {
    var image = document.getElementById("qrCode");
    
    //Create a element
    var downloadLink = document.createElement("a");
    downloadLink.href = image.src;
    downloadLink.download = "qrcode.jpg";

    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
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

    function dateFormat(){
        // Customize the date format as needed
        const dateFormat = "HH:mm DD.MM.YYYY";
        const divider = "/";

        const dateElements = document.querySelectorAll("#endpointList > div > div > div:nth-child(3) > a");

        function formatDate(date, format, divider) {
            const day = date.getDate().toString().padStart(2, '0');
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const year = date.getFullYear();
            const hours = date.getHours().toString().padStart(2, '0');
            const minutes = date.getMinutes().toString().padStart(2, '0');

            let formattedDate = format
                .replace("DD", day)
                .replace("MM", month)
                .replace("YYYY", year)
                .replace("HH", hours)
                .replace("mm", minutes);

            formattedDate = formattedDate.replace(/\./g, divider);

            return formattedDate;
        }

        dateElements.forEach(dateElement => {
            let dateText = dateElement.textContent.trim();
            if (dateText.toLowerCase() === "never") {
                return; 
            }

            let [datePart, timePart] = dateText.split(' ');

            let originalDate = new Date(datePart + 'T' + timePart);

            let formattedDateTime = formatDate(originalDate, dateFormat, divider);

            dateElement.textContent = formattedDateTime;
        });

    }dateFormat()

};


function updatePlaceHolder(input) {

    var usernameInput = document.getElementById(input);
    var placeholderParagraph = document.getElementById(input+'placeholder');
    var hideshow = document.querySelector("#hideShow"+input)
  
  try {
    hideshow.classList.add('hideShowFucused');
    placeholderParagraph.classList.add('placeholderWithText');
  
    document.getElementById(input).addEventListener('blur', function() {
        placeholderParagraph.classList.remove('placeholderWithText');
        hideshow.classList.remove('hideShowFucused');
        if (usernameInput.value !== "") {
          placeholderParagraph.classList.add('placeholderWithText');
          hideshow.classList.add('hideShowFucused');
        } else {
          placeholderParagraph.classList.remove('placeholderWithText');
          hideshow.classList.remove('hideShowFucused');
        }
   
      });
  
    } catch (error) {
        try {
            

    placeholderParagraph.classList.add('placeholderWithText');
  
    document.getElementById(input).addEventListener('blur', function() {
        placeholderParagraph.classList.remove('placeholderWithText');
        if (usernameInput.value !== "") {
          placeholderParagraph.classList.add('placeholderWithText');
        } else {
          placeholderParagraph.classList.remove('placeholderWithText');
        }
   
      });
    } catch (error) {}
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


updatePlaceHolder("index");

