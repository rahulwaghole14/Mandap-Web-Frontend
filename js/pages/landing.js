document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide icons
  lucide.createIcons();

  // Hero section animation
  const heroContent = document.getElementById('hero-content');
  if (heroContent) {
    // Small delay to ensure the browser paints the initial state
    setTimeout(() => {
      heroContent.classList.remove('opacity-0', 'translate-y-10');
      heroContent.classList.add('opacity-100', 'translate-y-0');
    }, 100);
  }

  // Features carousel logic
  const featuresContainer = document.getElementById('features-container');
  if (featuresContainer) {
    const featureCards = featuresContainer.querySelectorAll('.feature-card');
    let currentFeature = 0;

    const updateFeatureHighlight = () => {
      // Remove highlight from all
      featureCards.forEach(card => {
        card.classList.remove('ring-2', 'ring-blue-500', 'scale-105');
      });
      // Add highlight to current
      featureCards[currentFeature].classList.add('ring-2', 'ring-blue-500', 'scale-105');
      
      // Increment and loop
      currentFeature = (currentFeature + 1) % featureCards.length;
    };

    // Initialize next step
    currentFeature = 1;
    setInterval(updateFeatureHighlight, 3000);
  }

  // Navigation handlers
  const handleLoginClick = () => {
    window.location.href = 'login.html';
  };

  const loginButtons = [
    document.getElementById('get-started-btn'),
    document.getElementById('cta-get-started-btn')
  ];

  loginButtons.forEach(btn => {
    if (btn) {
      btn.addEventListener('click', handleLoginClick);
    }
  });
});
