document.addEventListener('DOMContentLoaded', () => {
    //Info box
    var infoBox = document.getElementById("infoBox");
    var boxBox = document.querySelector(".boxBox");
    var endpointList = document.getElementById("endpointList");

        document.addEventListener('click', (event) => {
            try {
                if (!boxBox.contains(event.target) && !endpointList.contains(event.target)) {
                    infoBox.style.display = "none";
                }
            } catch (error) {}
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                infoBox.style.display = "none";
            }
        });

    //Flash message
    try {
        const flashMessage = document.querySelector("body > div.flashMessage");
        if (flashMessage) {
            if (flashMessage.style.opacity === '1') {
                clearTimeout(flashMessage.timeoutId);
            }
            flashMessage.style.opacity = '1';
            flashMessage.timeoutId = setTimeout(() => flashMessage.style.opacity = '0', 3000);
        }
    } catch (error) {}

});

function downloadQr() {
    var image = document.getElementById("qrCode");
    var downloadLink = document.createElement("a");
    downloadLink.href = image.src;
    downloadLink.download = "qrcode.jpg";
    downloadLink.click();
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

    function dateFormat() {
        const dateFormat = "HH:mm DD.MM.YYYY".replace(/\./g, "/");
        const dateElements = document.querySelectorAll("#endpointList > div > div > div:nth-child(3) > a");

        dateElements.forEach(dateElement => {
            let dateText = dateElement.textContent.trim();
            if (dateText.toLowerCase() === "never") return;

            let [datePart, timePart] = dateText.split(' ');
            let originalDate = new Date(datePart + 'T' + timePart);

            let formattedDate = dateFormat
                .replace("DD", originalDate.getDate().toString().padStart(2, '0'))
                .replace("MM", (originalDate.getMonth() + 1).toString().padStart(2, '0'))
                .replace("YYYY", originalDate.getFullYear())
                .replace("HH", originalDate.getHours().toString().padStart(2, '0'))
                .replace("mm", originalDate.getMinutes().toString().padStart(2, '0'));

            dateElement.textContent = formattedDate;
        });
    }
    dateFormat();

};
