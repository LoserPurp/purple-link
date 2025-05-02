function makeQR(index) {
    const boxBox = document.querySelector(".boxBox");
    const changeEndpointContainer = document.getElementById("changeEndpointContainer");
    const infoBox = document.getElementById("infoBox");
    const qrInfo = document.getElementById("qrInfo");
  
    // Hide changeEndpointContainer (no animation)
    changeEndpointContainer.hidden = true;
    changeEndpointContainer.classList.remove("popup-animate");
  
    // Show infoBox and qrInfo
    infoBox.style.display = "flex";
    qrInfo.style.display = "flex";
  
    // Reset and animate boxBox popup
    boxBox.classList.remove("popup-animate");
    void boxBox.offsetWidth; // force reflow
    boxBox.classList.add("popup-animate");
  
    fetch("/qr", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: "index=" + encodeURIComponent(index),
    })
      .then((response) => {
        if (!response.ok)
          throw new Error("Request failed with status: " + response.status);
        return response.json();
      })
      .then((response) => {
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
      .catch((error) => {
        console.error(error);
        alert("Error: Index not found");
      });
  }
  
  function closeBoxBox() {
    const boxBox = document.querySelector(".boxBox");
    const changeEndpointContainer = document.getElementById("changeEndpointContainer");
    const infoBox = document.getElementById("infoBox");
    const qrInfo = document.getElementById("qrInfo");
  
    // Hide containers
    infoBox.style.display = "none";
    qrInfo.style.display = "none";
    changeEndpointContainer.hidden = true;
  
    // Remove animation classes to reset state
    boxBox.classList.remove("popup-animate");
    changeEndpointContainer.classList.remove("popup-animate");
  
    // Optionally reset inline styles if you used any (not needed if using CSS classes)
    boxBox.style.opacity = "";
    boxBox.style.transform = "";
    boxBox.style.transition = "";
  
    changeEndpointContainer.style.opacity = "";
    changeEndpointContainer.style.transform = "";
    changeEndpointContainer.style.transition = "";
  }