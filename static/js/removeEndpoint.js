//XMLHttps request for removing entry a in the json file
function removeEndpoint(index) {
    fetch('/remove_endpoint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'index=' + encodeURIComponent(index)
    })
    .then(response => {
        if (!response.ok) throw new Error('Request failed with status: ' + response.status);
        window.location.href = '/';
    })
    .catch(error => {
        console.error('Request failed:', error);
        alert('Error: Index not found');
    });
}
