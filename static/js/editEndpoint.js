function editEndpoint(index) {
    const changeEndpointContainer = document.getElementById("changeEndpointContainer");
    const infoBox = document.getElementById("infoBox");
    const qrInfo = document.getElementById("qrInfo");
  
    // Switch view
    qrInfo.style.display = "none";
    changeEndpointContainer.style.display = "block";
    infoBox.style.display = "flex"; // Show modal overlay
  
    document.getElementById("index").value = index;

    // Apply permissions to UI
    const perms = window.currentUserPermissions || {};
    
    const fields = {
        'new_endpoint': 'custom_alias',
        'new_expiry': 'expiry',
        'new_uses': 'uses',
        'new_redirect': 'redirect'
    };

    // Handle standard fields
    for (const [id, perm] of Object.entries(fields)) {
        const el = document.getElementById(id);
        if (el) {
            // Find the parent container (.form-group or similar wrapper)
            // For new_redirect (checkbox), the parent might be the label, and that label's parent is the div
            let container = el.closest('.form-group');
            
            // Special case for redirect toggle which is structured differently
            if (id === 'new_redirect') {
                container = el.closest('div[style*="display: flex"]');
            }

            if (!perms[perm]) {
                el.disabled = true;
                if (container) container.style.display = 'none';
            } else {
                el.disabled = false;
                if (container) {
                     if (id === 'new_redirect') {
                         container.style.display = 'flex';
                     } else {
                         container.style.display = 'block';
                     }
                }
            }
        }
    }
    
    // Handle password button
    const passBtn = document.getElementById("showPasswordButton");
    const passwordContainer = document.querySelector(".passwordContainerSidebySide");

    if (passBtn) {
        if (!perms['password']) {
            passBtn.style.display = 'none';
            if (passwordContainer) passwordContainer.style.display = 'none'; // Ensure inputs are also hidden
        } else {
             // Only show button initially, container is toggled by button
             passBtn.style.display = 'flex'; 
        }
    }

    getEndpointData(index).then((endpointData) => {
      function changeData(id, value) {
        const el = document.getElementById(id);
        if (!el) return;

        if (id === "new_expiry") {
            // value is YYYY-MM-DD HH:MM
            // input type=datetime-local expects YYYY-MM-DDTHH:MM
            if (value && value.includes(' ')) {
                el.value = value.replace(' ', 'T');
            } else {
                el.value = value;
            }
        } else if (id === "new_redirect") {
            el.checked = (value === "on");
        } else {
            el.value = value;
        }
      }
  
      // Reset placeholders if using input.js, but we are not.
      // However, we mock initializePlaceholders in index.html, so it's fine.
      if (typeof initializePlaceholders === 'function') {
        setTimeout(() => initializePlaceholders(), 1);
      }
  
      for (const key in endpointData) {
        if (endpointData[key]) {
          let id = key === "pass" ? "old_password" : "new_" + key;
          changeData(id, endpointData[key]);
        }
      }
    });
  
    // Reset password UI
    if (passwordContainer && perms['password']) {
        passwordContainer.style.display = "none";
    }
  
    const buttonUrlContainer = document.getElementById("showPasswordButton");
    if (buttonUrlContainer && perms['password']) {
        buttonUrlContainer.style.display = "flex";
    }
}
