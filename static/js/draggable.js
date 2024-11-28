let isInitialized = false;
let konamiCode = [
    "ArrowUp", "ArrowUp",
    "ArrowDown", "ArrowDown",
    "ArrowLeft", "ArrowRight",
    "ArrowLeft", "ArrowRight",
    "b", "a"
];
let konamiCodePosition = 0;

function initializeDraggable() {
    if (isInitialized) return; // Prevent re-initialization
    isInitialized = true;

    const draggable = document.querySelector('.draggable');
    const dragHeader = draggable.querySelector('.drag-header');
    const body = document.body;

    let isDragging = false;
    let offsetX = 0;
    let offsetY = 0;

    // Center the draggable element based on its actual size
    const centerElement = () => {
        const rect = draggable.getBoundingClientRect(); // Dynamically get dimensions
        const windowWidth = window.innerWidth; // Screen width
        const windowHeight = window.innerHeight; // Screen height

        // Calculate position to place the center of the div at the center of the screen
        const centerLeft = (windowWidth - rect.width) / 2;
        const centerTop = (windowHeight - rect.height) / 2;

        draggable.style.left = `${centerLeft}px`;
        draggable.style.top = `${centerTop}px`;
    };

    // Immediately center the element when initialized
    centerElement();

    // Re-center on window resize
    window.addEventListener('resize', centerElement);

    // Mouse down event to start dragging
    dragHeader.addEventListener('mousedown', (e) => {
        isDragging = true;
        offsetX = e.clientX - draggable.getBoundingClientRect().left;
        offsetY = e.clientY - draggable.getBoundingClientRect().top;
        body.classList.add('no-select');
    });

    // Mouse move event to handle dragging
    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            const rect = draggable.getBoundingClientRect(); // Dynamically get dimensions
            const minLeft = 0;
            const minTop = 0;
            const maxLeft = window.innerWidth - rect.width;
            const maxTop = window.innerHeight - rect.height;

            let newLeft = e.clientX - offsetX;
            let newTop = e.clientY - offsetY;

            // Constrain within window boundaries
            newLeft = Math.max(minLeft, Math.min(newLeft, maxLeft));
            newTop = Math.max(minTop, Math.min(newTop, maxTop));

            draggable.style.left = `${newLeft}px`;
            draggable.style.top = `${newTop}px`;
        }
    });

    // Mouse up event to stop dragging
    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            body.classList.remove('no-select');
        }
    });

    // Initialize the Konami Code listener
    document.addEventListener('keydown', handleKonamiCode);
}

// Konami Code Easter Egg Logic
function handleKonamiCode(event) {
    const key = event.key;
    if (key === konamiCode[konamiCodePosition]) {
        konamiCodePosition++;
        if (konamiCodePosition === konamiCode.length) {
            konamiCodeActivated();
            konamiCodePosition = 0; // Reset the sequence
        }
    } else {
        konamiCodePosition = 0; // Reset on incorrect input
    }
}

// Easter Egg: Bouncing Logic
function konamiCodeActivated() {
    const draggable = document.querySelector('.draggable');
    const rect = draggable.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    let xDirection = 1; // 1 for right, -1 for left
    let yDirection = 1; // 1 for down, -1 for up
    let speed = 1; // Movement speed

    const bounce = () => {
        const rect = draggable.getBoundingClientRect();
        let left = rect.left + speed * xDirection;
        let top = rect.top + speed * yDirection;

        // Reverse direction if hitting boundaries
        if (left <= 0 || left + rect.width >= windowWidth) {
            xDirection *= -1;
        }
        if (top <= 0 || top + rect.height >= windowHeight) {
            yDirection *= -1;
        }

        // Apply new position
        draggable.style.left = `${left}px`;
        draggable.style.top = `${top}px`;

        requestAnimationFrame(bounce); // Continue animation
    };

    bounce(); // Start bouncing
}
