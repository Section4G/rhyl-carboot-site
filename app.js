// Simple Car Boot Site JavaScript
let currentStatus = false;
let customNotice = '';
let galleryImages = [];

// API URLs
const API_STATUS = '/api/status';
const API_GALLERY = '/api/gallery';
const API_HERO_BG = '/api/hero-background';

// Fetch status from API
async function fetchStatus() {
    try {
        const response = await fetch(`${API_STATUS}?t=${Date.now()}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error('Error fetching status:', error);
        return null;
    }
}

// Fetch gallery images
async function fetchGallery() {
    try {
        const response = await fetch(`${API_GALLERY}?t=${Date.now()}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        return data.images || [];
    } catch (error) {
        console.error('Error fetching gallery:', error);
        return [];
    }
}

// Fetch hero background
async function fetchHeroBackground() {
    try {
        const response = await fetch(`${API_HERO_BG}?t=${Date.now()}`);
        if (!response.ok) return null;
        return await response.json();
    } catch (error) {
        console.error('Error fetching hero background:', error);
        return null;
    }
}

// Update status display
function updateStatusDisplay() {
    const statusIndicator = document.getElementById('statusIndicator');
    const statusText = document.getElementById('statusText');
    const customNoticeDiv = document.getElementById('customNotice');
    const customNoticeText = document.getElementById('customNoticeText');

    if (statusIndicator && statusText) {
        if (currentStatus) {
            statusIndicator.className = 'status-indicator open';
            statusText.textContent = 'CURRENTLY OPEN';
        } else {
            statusIndicator.className = 'status-indicator closed';
            statusText.textContent = 'CURRENTLY CLOSED';
        }
    }

    // Handle custom notice
    if (customNotice && customNotice.trim()) {
        if (customNoticeText) customNoticeText.textContent = customNotice;
        if (customNoticeDiv) customNoticeDiv.classList.remove('hidden');
    } else {
        if (customNoticeDiv) customNoticeDiv.classList.add('hidden');
    }
}

// Update hero background
function updateHeroBackground(backgroundData) {
    if (!backgroundData || !backgroundData.filename) return;

    const heroSection = document.getElementById('hero-section');
    if (heroSection) {
        const imageUrl = `/uploads/hero/${backgroundData.filename}`;
        heroSection.style.backgroundImage = `
            linear-gradient(135deg, rgba(33, 128, 141, 0.8) 0%, rgba(29, 116, 128, 0.8) 100%), 
            url('${imageUrl}')
        `;
        heroSection.style.backgroundSize = 'cover';
        heroSection.style.backgroundPosition = 'center center';
        heroSection.style.backgroundRepeat = 'no-repeat';
    }
}

// Update gallery display
function updateGalleryDisplay(images) {
    galleryImages = images || [];
    const galleryScroll = document.getElementById('galleryScroll');
    const galleryContainer = document.getElementById('galleryContainer');
    const galleryEmpty = document.getElementById('galleryEmpty');

    if (!galleryScroll) return;

    if (galleryImages.length === 0) {
        if (galleryContainer) galleryContainer.classList.add('hidden');
        if (galleryEmpty) galleryEmpty.classList.remove('hidden');
        return;
    }

    // Show gallery elements
    if (galleryContainer) galleryContainer.classList.remove('hidden');
    if (galleryEmpty) galleryEmpty.classList.add('hidden');

    // Generate gallery HTML
    galleryScroll.innerHTML = galleryImages.map((image, index) => {
        const imageUrl = `/uploads/gallery/${image.filename}`;
        return `
            <div class="card" style="text-align: center;">
                <img src="${imageUrl}" 
                     alt="${image.description || 'Car boot sale photo'}"
                     style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px; margin-bottom: 10px;">
                <p style="margin: 0; font-size: 0.9rem; color: #666;">${image.description || 'Car boot sale photo'}</p>
            </div>
        `;
    }).join('');
}

// Setup navigation with smooth scrolling
function setupNavigation() {
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Load all settings from API
async function loadSettings() {
    try {
        // Load status
        const statusData = await fetchStatus();
        if (statusData) {
            currentStatus = !!statusData.status;
            customNotice = statusData.notice || '';
            updateStatusDisplay();
        }

        // Load gallery
        const images = await fetchGallery();
        updateGalleryDisplay(images);

        // Load hero background
        const heroData = await fetchHeroBackground();
        if (heroData) {
            updateHeroBackground(heroData);
        }

        console.log('✅ Settings loaded successfully');
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚗 Rhyl Car Boot Site Loading...');
    
    // Setup functionality
    setupNavigation();
    
    // Load initial data
    await loadSettings();

    // Refresh every 30 seconds
    setInterval(loadSettings, 30000);

    console.log('✅ Site initialized successfully');
});

// Refresh when tab becomes active
document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
        loadSettings();
    }
});

console.log('🚗 Rhyl Car Boot JavaScript loaded');