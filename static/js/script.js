// Modal Logic
function closeBoxBox() {
    const infoBox = document.getElementById("infoBox");
    const qrInfo = document.getElementById("qrInfo");
    const changeEndpointContainer = document.getElementById("changeEndpointContainer");
    
    if (infoBox) infoBox.style.display = "none";
    if (qrInfo) qrInfo.style.display = "none";
    if (changeEndpointContainer) changeEndpointContainer.style.display = "block"; // Reset default
}

// Close modal on outside click or Escape
document.addEventListener('DOMContentLoaded', () => {
    // Flash Message Auto-Dismiss
    const flashMessages = document.querySelectorAll('.alert');
    flashMessages.forEach(msg => {
        setTimeout(() => {
            msg.style.opacity = '0';
            setTimeout(() => msg.remove(), 500);
        }, 3000);
    });

    // Generic Modal Close Logic
    // This handles closing ANY modal-overlay when clicking outside the content
    const overlays = document.querySelectorAll('.modal-overlay');
    overlays.forEach(overlay => {
        overlay.addEventListener('click', (event) => {
            if (event.target === overlay) {
                // Special handling for infoBox/BoxBox which has specific close logic
                if (overlay.id === 'infoBox') {
                    closeBoxBox();
                } else {
                    overlay.style.display = 'none';
                }
            }
        });
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === "Escape") {
            closeBoxBox(); // Close main modal
            // Close other modals
            document.querySelectorAll('.modal-overlay').forEach(el => el.style.display = 'none');
        }
    });

    dateFormat();
});

function showToast(message, type = 'success') {
    // Remove existing toasts to avoid stacking too many
    const existingToasts = document.querySelectorAll('.toast');
    existingToasts.forEach(t => t.remove());

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    document.body.appendChild(toast);

    // Trigger reflow
    void toast.offsetWidth;

    // Show
    toast.classList.add('show');

    // Hide after 3s
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function downloadQr() {
    const image = document.getElementById("qrCode");
    const downloadLink = document.createElement("a");
    downloadLink.href = image.src;
    downloadLink.download = "qrcode.jpg";
    downloadLink.click();
    showToast("QR Code downloaded!");
}

function showPassword() {
    const passwordContainer = document.querySelector(".passwordContainerSidebySide");
    passwordContainer.style.display = "flex";
    const buttonContainer = document.getElementById("showPasswordButton");
    buttonContainer.style.display = "none";
}

function dateFormat() {
    const dateFormatStr = "HH:mm DD.MM.YYYY".replace(/\./g, "/");
    // Selector for the date column in the new grid layout
    // #endpointList .url-row > div:nth-child(4) > a
    const dateElements = document.querySelectorAll("#endpointList .url-row > div:nth-child(4) > a");

    dateElements.forEach(dateElement => {
        let dateText = dateElement.textContent.trim();
        if (dateText.toLowerCase() === "never") return;
        if (!dateText) return;

        // Check if already formatted or valid ISO
        // The backend sends YYYY-MM-DD HH:MM (from convert_time_format)
        // We want HH:mm DD/MM/YYYY
        
        let [datePart, timePart] = dateText.split(' ');
        if (!datePart || !timePart) return;

        let originalDate = new Date(datePart + 'T' + timePart);
        if (isNaN(originalDate.getTime())) return;

        let formattedDate = dateFormatStr
            .replace("DD", originalDate.getDate().toString().padStart(2, '0'))
            .replace("MM", (originalDate.getMonth() + 1).toString().padStart(2, '0'))
            .replace("YYYY", originalDate.getFullYear())
            .replace("HH", originalDate.getHours().toString().padStart(2, '0'))
            .replace("mm", originalDate.getMinutes().toString().padStart(2, '0'));

        dateElement.textContent = formattedDate;
    });
}
