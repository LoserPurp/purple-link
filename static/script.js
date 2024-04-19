
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
            document.getElementById("qrCode").src=img.src;
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
    document.getElementById("expiry").hidden = !document.getElementById("expiry").hidden
}


function editEndpoint(index) {
    document.getElementById("qrInfo").style.display = "none"
    document.getElementById("infoBox").style.display = 'flex'

    //Flips element from hidden to visible
    document.getElementById("changeEndpointContainer").hidden = false
    document.getElementById("index").value = index
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
    function handleClickOutside(event) {
        // Check if the clicked element is outside of the boxBox
        if (!boxBox.contains(event.target) && !endpointList.contains(event.target)) {
            // If it's outside, hide the infoBox
            infoBox.style.display = "none";
        }
    }

    // Add click event listener to the document
    document.addEventListener("click", handleClickOutside);
});
    

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


