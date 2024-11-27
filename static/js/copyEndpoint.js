function copyEndpoint(index) {
    const endpoint = document.getElementById("endpoint" + index).href;
    navigator.clipboard.writeText(endpoint);
}
