//Flips element from hidden to visible
function setExpiry() {
    var expiryElement = document.getElementById("expiry");
    var buttonUrlContainer = document.getElementById("buttonUrlContainer");

    expiryElement.style.bottom = (expiryElement.style.bottom === "0px") ? "355px" : "0px";
    buttonUrlContainer.style.bottom = (buttonUrlContainer.style.bottom === "0px") ? "305px" : "0px";
}