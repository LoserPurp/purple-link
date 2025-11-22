const qrCache = new Map();

function preloadQR(index) {
  if (qrCache.has(index)) return;

  const promise = fetch("/qr", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: "index=" + encodeURIComponent(index),
  }).then((response) => {
    if (!response.ok)
      throw new Error("Request failed with status: " + response.status);
    return response.json();
  });

  qrCache.set(index, promise);
}

function makeQR(index) {
  const changeEndpointContainer = document.getElementById(
    "changeEndpointContainer"
  );
    const infoBox = document.getElementById("infoBox");
    const qrInfo = document.getElementById("qrInfo");
  
    // Switch view
    changeEndpointContainer.style.display = "none";
    qrInfo.style.display = "flex";
    infoBox.style.display = "flex"; // Show modal overlay
  
  if (!qrCache.has(index)) {
    preloadQR(index);
  }

  qrCache
    .get(index)
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
      qrCache.delete(index); // Retry on next attempt
      });
  }
