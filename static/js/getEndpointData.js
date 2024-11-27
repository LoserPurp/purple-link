
function getEndpointData(index) {
    const formData = new FormData();
    formData.append('index', index);

    return fetch('/endpoint_details', {
        method: 'POST',
        body: formData,
        headers: {
            'Accept': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => data)
    .catch(error => {
        console.error('Error:', error);
    });
}