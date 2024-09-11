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
        expiryElement.style.bottom = "250px";  // Move it down (hide it)
    } else {
        expiryElement.style.bottom = "0px";  // Move it up (show it)
    }

    // Toggle for .buttonUrlContainer
    if (buttonUrlContainer.style.bottom === "0px") {
        buttonUrlContainer.style.bottom = "250px";  // Move it down (hide it)
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

    getEndpointData(index).then(endpointData => {
    console.log(endpointData);
    document.getElementById("new_endpoint").value = endpointData.endpoint
    document.getElementById("new_url").value = endpointData.url
    document.getElementById("new_expiry").value = endpointData.expiry
    document.getElementById("new_uses").value = endpointData.uses

    // document.getElementById("old_password") = endpointData.
    // document.getElementById("new_password") = endpointData.
    })
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

// function shortenURL() {
//     length = document.getElementById("endpointList").children.length
//     for (var i = 0; i < length; i++) {
//         n = document.getElementById("endpointList").children[i].children[1]
//         if (n.innerHTML.length > 35) {
//             n.innerHTML = n.innerHTML.substring(0, 35)+"..."
//         }
//     }
// }

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