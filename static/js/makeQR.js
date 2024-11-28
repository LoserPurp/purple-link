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
    initializeDraggable();
}
