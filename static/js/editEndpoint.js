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
                // updatePlaceHolder(id)
                document.getElementById(id).value = value
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

        setTimeout(() => {
            initializePlaceholders();
        }, 1);


    //checks if entry is empty and updates the values
    for (key in endpointData) {
        if (endpointData[key]) {
            if (key == "pass") {
                id = "old_password"
            }
            else {id = "new_"+key}
            
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
    initializeDraggable();
}