function showSomething(getName) {
    try {
        const container = document.getElementById('endpointList');
        container.innerHTML = '';  // Clear the container
        
        if (getName) {
        // First fetch and insert HTML
        fetch('/settings/'+getName)
            .then(response => response.text())
            .then(html => {
                // Once the fetch is complete and HTML is loaded into the DOM
                const newDiv = document.createElement('div');
                newDiv.innerHTML = html;
                container.appendChild(newDiv);
                // Test Code. This adds a new element to the fetched HTML
                const otherContainer = document.querySelector("#settingsContent");
                if (otherContainer) {
                    const anotherDiv = document.createElement('div');
                    const newHeading = document.querySelector("#SettingsLabel");
                    newHeading.textContent = getName.charAt(0).toUpperCase() + getName.slice(1).toLowerCase();
                    otherContainer.appendChild(anotherDiv);
                } else {
                    console.error('Element #settingsContent not found');
                }
            })
            .catch(error => {
                console.error('Error loading the head:', error);
            });
        }
    } catch (error) {
        console.error(error);
    }
}