document.addEventListener('DOMContentLoaded', () => {
    const draggable = document.querySelector('.draggable');
    const dragHeader = document.querySelector('.drag-header');
    const body = document.body;
    const excludedClasses = ['boxBox', 'draggable', 'drag-header'];

    let isDragging = false;
    let offsetX = 0;
    let offsetY = 0;

    // Center the draggable element on startup
    const centerElement = () => {
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        const elementWidth = 552; // Known width of the element
        const elementHeight = 534.56; // Known height of the element

        const centerLeft = (windowWidth / 2) - (elementWidth / 2);
        const centerTop = (windowHeight / 2) - (elementHeight / 2);

        draggable.style.left = `${centerLeft}px`;
        draggable.style.top = `${centerTop}px`;
    };

    // Run the centering function on page load
    centerElement();

    // Start dragging
    dragHeader.addEventListener('mousedown', (e) => {
        isDragging = true;
        offsetX = e.clientX - draggable.getBoundingClientRect().left;
        offsetY = e.clientY - draggable.getBoundingClientRect().top;
        draggable.style.cursor = 'grabbing';

        // Add no-select class to all elements except the excluded ones
        document.querySelectorAll('*').forEach((el) => {
            if (!excludedClasses.some((cls) => el.classList.contains(cls))) {
                el.classList.add('no-select');
            }
        });
    });

    // Dragging movement
    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            const minLeft = 0;
            const minTop = 0;
            const maxLeft = window.innerWidth - 552;
            const maxTop = window.innerHeight - 534.56;

            let newLeft = e.clientX - offsetX;
            let newTop = e.clientY - offsetY;

            if (newLeft < minLeft) newLeft = minLeft;
            if (newTop < minTop) newTop = minTop;
            if (newLeft > maxLeft) newLeft = maxLeft;
            if (newTop > maxTop) newTop = maxTop;

            draggable.style.left = `${newLeft}px`;
            draggable.style.top = `${newTop}px`;
        }
    });

    // Stop dragging
    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            draggable.style.cursor = 'default';

            // Remove no-select class from all elements
            document.querySelectorAll('.no-select').forEach((el) => {
                el.classList.remove('no-select');
            });
        }
    });

    // Recenter on window resize
    window.addEventListener('resize', centerElement);
});
