//Flips element from hidden to visible
function setExpiry() {
    const expiryElement = document.getElementById("expiry");
    const buttonUrlContainer = document.getElementById("buttonUrlContainer");

    expiryElement.classList.toggle("show");
    buttonUrlContainer.style.bottom = (buttonUrlContainer.style.bottom === "0px") ? "305px" : "0px";
}