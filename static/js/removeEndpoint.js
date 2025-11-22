//XMLHttps request for removing entry a in the json file
function removeEndpoint(index, event) {
    // Check if modifier keys are pressed (Ctrl or Shift)
    // If so, skip confirmation
    const skipConfirmation = event && (event.ctrlKey || event.shiftKey);

    if (!skipConfirmation) {
        showConfirmModal(index);
        return;
    }

    executeRemove(index);
}

function executeRemove(index) {
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
        showToast('Error: Index not found', 'error');
    });
}

function showConfirmModal(index) {
    const modal = document.getElementById('confirmModal');
    const confirmBtn = document.getElementById('confirmBtn');
    const tipElement = document.getElementById('quickDeleteTip');
    
    // Set up the confirm button action
    confirmBtn.onclick = function() {
        executeRemove(index);
        closeConfirmModal();
    };
    
    // Handle Tip Logic
    let count = parseInt(localStorage.getItem('deleteModalCount') || '0');
    const alwaysShow = localStorage.getItem('alwaysShowDeleteTip') === 'true';

    if (alwaysShow || count < 3) {
        tipElement.style.display = 'block';
        if (!alwaysShow) {
            localStorage.setItem('deleteModalCount', (count + 1).toString());
        }
    } else {
        tipElement.style.display = 'none';
    }

    modal.style.display = 'flex';
}

function closeConfirmModal() {
    document.getElementById('confirmModal').style.display = 'none';
}
