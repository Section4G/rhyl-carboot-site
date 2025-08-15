// 🚀 MOBILE-OPTIMIZED Car Boot Site JavaScript
let currentStatus = false;
let customNotice = '';
let galleryImages = [];

// Device detection
const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
const isSlowConnection = navigator.connection && navigator.connection.effectiveType && 
                        ['slow-2g', '2g', '3g'].includes(navigator.connection.effectiveType);

// API URLs
const API_STATUS = '/api/status';
const API_GALLERY = '/api/gallery';
const API_HERO_BG = '/api/hero-background';

// 🚀 Optimized fetch with timeout for mobile
async function fetchWithTimeout(url, timeout = 5000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
        const response = await fetch(`${url}?t=${Date.now()}`, {
            signal: controller.signal,
            headers: { 'Accept': 'application/json' }
        });
        clearTimeout(timeoutId);
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
    } catch (error) {
        clearTimeout(timeoutId);
        console.error('Fetch error:', error.name);
        return null;
    }
}

// 🚀 MOBILE: Fast status fetch
async function fetchStatus() {
    return await fetchWithTimeout(API_STATUS, 3000);
}

// 🚀 MOBILE: Lazy load gallery only when needed
async function fetchGallery() {
    // Skip gallery on slow connections initially
    if (isSlowConnection) {
        setTimeout(() => fetchGallery(), 2000);
        return [];
    }
    
    const data = await fetchWithTimeout(API_GALLERY, 5000);
    return data?.images || [];
}

// 🚀 MOBILE: Lazy load hero background
async function fetchHeroBackground() {
    // Load hero background after other content on mobile
    if (isMobile) {
        setTimeout(() => fetchHeroBackground(), 1000);
        return null;
    }
    
    return await fetchWithTimeout(API_HERO_BG, 5000);
}

// 🚀 MOBILE: Optimized status display with animation
function updateStatusDisplay() {
    const statusIndicator = document.getElementById('statusIndicator');
    const statusText = document.getElementById('statusText');
    const customNoticeDiv = document.getElementById('customNotice');
    const customNoticeText = document.getElementById('customNoticeText');

    if (statusIndicator && statusText) {
        // Add loading state first
        statusIndicator.style.opacity = '0.7';
        
        setTimeout(() => {
            if (currentStatus) {
                statusIndicator.className = 'status-indicator open';
                statusText.textContent = 'CURRENTLY OPEN';
            } else {
                statusIndicator.className = 'status-indicator closed';
                statusText.textContent = 'CURRENTLY CLOSED';
            }
            statusIndicator.style.opacity = '1';
        }, 100);
    }

    // Handle custom notice
    if (customNotice && customNotice.trim()) {
        if (customNoticeText) customNoticeText.textContent = customNotice;
        if (customNoticeDiv) customNoticeDiv.classList.remove('hidden');
    } else {
        if (customNoticeDiv) customNoticeDiv.classList.add('hidden');
    }
}

// 🚀 MOBILE: Lazy image loading with intersection observer
function setupLazyImages() {
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    const src = img.dataset.src;
                    if (src) {
                        img.src = src;
                        img.classList.add('loaded');
                        observer.unobserve(img);
                    }
                }
            });
        }, {
            rootMargin: '50px 0px',
            threshold: 0.01
        });
        
        return imageObserver;
    }
    return null;
}

// 🚀 MOBILE: Optimized hero background with fallback
function updateHeroBackground(backgroundData) {
    if (!backgroundData || !backgroundData.filename) return;

    const heroSection = document.getElementById('hero-section');
    if (heroSection && !isMobile) { // Skip on mobile for performance
        const imageUrl = `/uploads/hero/${backgroundData.filename}`;
        
        // Preload image first
        const img = new Image();
        img.onload = () => {
            heroSection.style.backgroundImage = `
                linear-gradient(135deg, rgba(33, 128, 141, 0.8) 0%, rgba(29, 116, 128, 0.8) 100%), 
                url('${imageUrl}')
            `;
            heroSection.style.backgroundSize = 'cover';
            heroSection.style.backgroundPosition = 'center center';
        };
        img.src = imageUrl;
    }
}

// 🚀 MOBILE: Optimized gallery with lazy loading
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

    // Generate optimized gallery HTML with lazy loading
    const imageObserver = setupLazyImages();
    
    galleryScroll.innerHTML = galleryImages.map((image, index) => {
        const imageUrl = `/uploads/gallery/${image.filename}`;
        return `
            <div class="card gallery-item" style="text-align: center;">
                <img data-src="${imageUrl}" 
                     src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='280' height='200'%3E%3Crect width='100%25' height='100%25' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23999'%3ELoading...%3C/text%3E%3C/svg%3E"
                     alt="${image.description || 'Car boot sale photo'}"
                     class="lazy-img"
                     style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px; margin-bottom: 10px; transition: opacity 0.3s;">
                <p style="margin: 0; font-size: 0.9rem; color: #666;">${image.description || 'Car boot sale photo'}</p>
            </div>
        `;
    }).join('');

    // Setup lazy loading for new images
    if (imageObserver) {
        galleryScroll.querySelectorAll('.lazy-img').forEach(img => {
            imageObserver.observe(img);
        });
    } else {
        // Fallback for older browsers - load immediately
        galleryScroll.querySelectorAll('.lazy-img').forEach(img => {
            img.src = img.dataset.src;
        });
    }
}

// 🚀 MOBILE: Optimized smooth scrolling with reduced motion support
function setupNavigation() {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: prefersReducedMotion ? 'auto' : 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// 🚀 MOBILE: Prioritized loading with connection awareness
async function loadSettings() {
    try {
        console.log('📱 Loading for mobile...');
        
        // Priority 1: Status (most important)
        const statusData = await fetchStatus();
        if (statusData) {
            currentStatus = !!statusData.status;
            customNotice = statusData.notice || '';
            updateStatusDisplay();
        }

        // Priority 2: Gallery (if not slow connection)
        if (!isSlowConnection) {
            const images = await fetchGallery();
            updateGalleryDisplay(images);
        }

        // Priority 3: Hero background (desktop only, delayed)
        if (!isMobile) {
            setTimeout(async () => {
                const heroData = await fetchHeroBackground();
                if (heroData) updateHeroBackground(heroData);
            }, 500);
        }

        console.log('✅ Mobile optimized loading complete');
    } catch (error) {
        console.error('Loading error:', error);
    }
}

// 🚀 MOBILE: Optimized scroll performance
let ticking = false;
function updateOnScroll() {
    if (!ticking) {
        requestAnimationFrame(() => {
            // Add any scroll-based optimizations here
            ticking = false;
        });
        ticking = true;
    }
}

// 🚀 MOBILE: Battery-aware refresh intervals
function getRefreshInterval() {
    if ('getBattery' in navigator) {
        navigator.getBattery().then(battery => {
            return battery.level < 0.2 ? 60000 : 30000; // Slower refresh on low battery
        });
    }
    return isSlowConnection ? 45000 : 30000; // Slower refresh on slow connections
}

// 🚀 MOBILE: Performance-optimized initialization
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚗📱 Mobile-optimized Car Boot Site Loading...');
    
    // Setup critical functionality first
    setupNavigation();
    
    // Add scroll listener with throttling
    if (isMobile) {
        let scrollTimeout;
        window.addEventListener('scroll', () => {
            if (scrollTimeout) clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(updateOnScroll, 16); // ~60fps throttling
        }, { passive: true });
    }
    
    // Load initial data with priority
    await loadSettings();

    // Setup periodic refresh with smart intervals
    const refreshInterval = getRefreshInterval();
    setInterval(loadSettings, refreshInterval);

    console.log(`✅ Mobile site ready! (${isMobile ? 'Mobile' : 'Desktop'} mode)`);
});

// 🚀 MOBILE: Smart visibility change handling
document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
        // Only refresh if tab was hidden for more than 30 seconds
        if (!window.lastVisibleTime || Date.now() - window.lastVisibleTime > 30000) {
            loadSettings();
        }
    }
    window.lastVisibleTime = Date.now();
});

// 🚀 MOBILE: Connection change handling
if ('connection' in navigator) {
    navigator.connection.addEventListener('change', function() {
        console.log('📶 Connection changed:', navigator.connection.effectiveType);
        // Reload settings with new connection awareness
        setTimeout(loadSettings, 1000);
    });
}

// 🚀 Add loading states CSS
const loadingStyles = `
    .lazy-img:not(.loaded) {
        filter: blur(1px);
        opacity: 0.7;
    }
    .lazy-img.loaded {
        filter: none;
        opacity: 1;
    }
    .gallery-item {
        transition: transform 0.2s ease;
    }
    .gallery-item:hover {
        transform: translateY(-2px);
    }
    @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
        }
    }
`;

// Inject styles
const styleSheet = document.createElement('style');
styleSheet.textContent = loadingStyles;
document.head.appendChild(styleSheet);

console.log('🚗📱 Mobile-optimized JavaScript loaded with performance enhancements');
