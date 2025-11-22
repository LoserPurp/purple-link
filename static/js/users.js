function addAccount(username, admin, expiry) {
    // Find the parent element to append the content
    const parentDiv = document.querySelector('.grid-header').parentElement;

    // Create the grid content container
    const contentDiv = document.createElement('div');
    contentDiv.className = 'grid-content';

    // Create the username grid item
    const usernameDiv = document.createElement('div');
    usernameDiv.className = 'grid-item';
    const usernameLink = document.createElement('a');
    usernameLink.textContent = username;
    usernameDiv.appendChild(usernameLink);

    // Create the admin grid item
    const adminDiv = document.createElement('div');
    adminDiv.className = 'grid-item';
    const adminLink = document.createElement('a');
    adminLink.textContent = admin ? 'YES' : 'NO';
    adminDiv.appendChild(adminLink);

    // Create the expiry grid item
    const expiryDiv = document.createElement('div');
    expiryDiv.className = 'grid-item';
    const expiryLink = document.createElement('a');
    expiryLink.textContent = expiry;
    expiryDiv.appendChild(expiryLink);

    // Create the action grid item
    const actionDiv = document.createElement('div');
    actionDiv.className = 'grid-item';
    const urlButtonContainer = document.createElement('div');
    urlButtonContainer.className = 'urlButtonContainer';

    // Add action buttons with appropriate event handlers
    const copyButton = document.createElement('img');
    copyButton.className = 'iconCopy';
    copyButton.src = '/static/img/copy.svg';
    copyButton.alt = 'Copy';
    copyButton.onclick = () => copyEndpoint(username);

    const qrButton = document.createElement('img');
    qrButton.className = 'iconQR';
    qrButton.src = '/static/img/qr.svg';
    qrButton.alt = 'QR';
    qrButton.onclick = () => makeQR(`/gAeNh/${username}`);
    qrButton.onmouseenter = () => preloadQR(`/gAeNh/${username}`);

    const editButton = document.createElement('img');
    editButton.className = 'iconEdit';
    editButton.src = '/static/img/edit.svg';
    editButton.alt = 'Edit';
    editButton.onclick = () => editEndpoint(username);

    const removeButton = document.createElement('img');
    removeButton.className = 'iconRemove';
    removeButton.src = '/static/img/trashcan.svg';
    removeButton.alt = 'Remove';
    removeButton.onclick = (event) => removeEndpoint(username, event);

    // Append buttons to the container
    urlButtonContainer.append(copyButton, qrButton, editButton, removeButton);
    actionDiv.appendChild(urlButtonContainer);

    // Append all items to the grid content
    contentDiv.append(usernameDiv, adminDiv, expiryDiv, actionDiv);

    // Append the new grid content to the parent
    parentDiv.appendChild(contentDiv);
}
