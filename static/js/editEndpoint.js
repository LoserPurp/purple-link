function editEndpoint(index) {
    document.getElementById("qrInfo").style.display = "none";
  
    const boxBox = document.querySelector(".boxBox");
    const changeEndpointContainer = document.getElementById("changeEndpointContainer");
    const infoBox = document.getElementById("infoBox");
  
    // Show infoBox
    infoBox.style.display = "flex";
  
    // Show and animate boxBox and changeEndpointContainer
    boxBox.classList.remove("popup-animate");
    changeEndpointContainer.classList.remove("popup-animate");
  
    // Force reflow to reset animation
    void boxBox.offsetWidth;
    void changeEndpointContainer.offsetWidth;
  
    // Show changeEndpointContainer
    changeEndpointContainer.hidden = false;
  
    // Add animation classes to trigger popup animation
    boxBox.classList.add("popup-animate");
    changeEndpointContainer.classList.add("popup-animate");
  
    document.getElementById("index").value = index;
  
    getEndpointData(index).then((endpointData) => {
      function changeData(id, value) {
        if (
          (id === "new_expiry" && document.getElementById(id).value === "") ||
          (id === "new_expiry" && document.getElementById(id).value !== "")
        ) {
          document.getElementById(id).value = value;
        } else if (id !== "new_redirect") {
          document.getElementById(id).value = value;
        } else if (value === "on") {
          document.getElementById("new_redirect").checked = true;
          buttonNoAnimation();
        } else if (value === "off") {
          document.getElementById("new_redirect").checked = false;
          buttonNoAnimation();
        }
      }
  
      setTimeout(() => {
        initializePlaceholders();
      }, 1);
  
      for (const key in endpointData) {
        if (endpointData[key]) {
          let id = key === "pass" ? "old_password" : "new_" + key;
          changeData(id, endpointData[key]);
        }
      }
    });
  
    const passwordContainer = document.querySelector(
      "#changeEndpointContainer > form > div.passwordContainerSidebySide"
    );
    passwordContainer.style.display = "none";
  
    const buttonUrlContainer = document.querySelector("#showPasswordButton");
    buttonUrlContainer.style.display = "flex";
  
    function buttonNoAnimation() {
      const style = document.createElement("style");
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