function copyEndpoint(index) {
    const endpoint = document.getElementById("endpoint" + index).href;
    navigator.clipboard.writeText(endpoint)
        .then(() => showToast("Copied to clipboard!"))
        .catch(() => showToast("Failed to copy", "error"));
}
