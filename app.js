document.addEventListener('DOMContentLoaded', () => {
    
    // ==================== INDIVIDUAL 3D CARD TILT EFFECT ====================
    const menuCards = document.querySelectorAll('.menu-card');

    menuCards.forEach(card => {
        const content3d = card.querySelector('.card-content-3d');
        const isSideCard = card.classList.contains('tg-card') || card.classList.contains('ds-card');
        const scaleStr = isSideCard ? 'scale(0.9) ' : '';
        
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left; // cursor x inside card
            const y = e.clientY - rect.top;  // cursor y inside card
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            // Calculate tilt degrees (max 6 degrees for a subtle, premium look)
            const tiltX = ((centerY - y) / centerY) * 6;
            const tiltY = ((x - centerX) / centerX) * 6;
            
            content3d.style.transform = `${scaleStr}rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateZ(20px)`;
            

        });

        card.addEventListener('mouseleave', () => {
            content3d.style.transform = `${scaleStr}rotateX(0deg) rotateY(0deg) translateZ(0)`;

        });
    });
});
