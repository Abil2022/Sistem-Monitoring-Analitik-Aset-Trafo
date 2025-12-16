// assets/js/home.js
document.addEventListener('DOMContentLoaded', function() {
    // Initialize stats animation
    animateStats();
    
    // Setup smooth scrolling
    setupSmoothScrolling();
    
    // Add hover effects to cards
    setupCardEffects();
});

function animateStats() {
    const statNumbers = document.querySelectorAll('.stat-number');
    const observerOptions = {
        threshold: 0.5,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const statNumber = entry.target;
                const targetValue = parseInt(statNumber.textContent);
                let currentValue = 0;
                const increment = targetValue / 50;
                
                const timer = setInterval(() => {
                    currentValue += increment;
                    if (currentValue >= targetValue) {
                        statNumber.textContent = targetValue + (targetValue === 11 ? '' : '');
                        clearInterval(timer);
                    } else {
                        statNumber.textContent = Math.floor(currentValue) + (targetValue === 11 ? '' : '');
                    }
                }, 30);
                
                observer.unobserve(statNumber);
            }
        });
    }, observerOptions);

    statNumbers.forEach(stat => {
        observer.observe(stat);
    });
}

function setupSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });
}

function setupCardEffects() {
    document.querySelectorAll('.access-card, .feature-card').forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
}

// Update stats with real-time data (simulated)
function updateStats() {
    // Simulate real-time data updates
    const totalGardu = document.getElementById('totalGardu');
    const activeGardu = document.getElementById('activeGardu');
    const dataSync = document.getElementById('dataSync');
    const monitoringStatus = document.getElementById('monitoringStatus');
    
    // Simulate data changes
    setTimeout(() => {
        if (totalGardu) totalGardu.textContent = '1,335';
        if (activeGardu) activeGardu.textContent = '11';
        if (dataSync) dataSync.textContent = '98.9%';
        if (monitoringStatus) monitoringStatus.textContent = '24/7';
    }, 5000);
}

// Initialize stats update
updateStats();