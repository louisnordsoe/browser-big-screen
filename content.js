if (!document.getElementById('tv-os-host')) {
    
// --- 1. Setup Host & Shadow DOM ---
    const host = document.createElement('div');
    host.id = 'tv-os-host';
    
    // CRITICAL FIX: Force the host to sit above EVERYTHING
    // 2147483647 is the maximum allowed z-index in browsers.
    host.style.cssText = `
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100% !important;
        height: 100% !important;
        pointer-events: none !important;
        z-index: 2147483647 !important;
        display: block !important;
    `;

    document.documentElement.appendChild(host);
    const shadow = host.attachShadow({mode: 'open'});

    const styleLink = document.createElement('link');
    styleLink.rel = 'stylesheet';
    styleLink.href = chrome.runtime.getURL('sidebar.css');
    shadow.appendChild(styleLink);

    // --- 2. Build Sidebar ---
    const container = document.createElement('div');
    container.id = 'tv-sidebar-container';
    container.innerHTML = `
        <div id="sidebar">
            <div class="separator"></div>
            <div id="app-list"></div>
        </div>
    `;
    shadow.appendChild(container);

    const sidebar = container.querySelector('#sidebar');
    const appList = container.querySelector('#app-list');
    
    // --- 3. Load Apps ---
    chrome.storage.local.get(['apps'], (result) => {
        const apps = result.apps || [];
        apps.forEach(app => {
            const btn = document.createElement('div');
            btn.className = 'sidebar-btn';
            btn.title = app.title;
            const iconImg = app.icon 
                ? `<img src="${app.icon}">` 
                : `<span>🌐</span>`;
            btn.innerHTML = iconImg;
            btn.onclick = () => window.location.href = app.url;
            appList.appendChild(btn);
        });
    });

    // --- 4. The "Push" & Auto-Hide Logic ---
    let hideTimer;
    let isVisible = false;

    // Apply smooth transition to the actual website body
    // We animate width and margin to compress the page content
    document.body.style.transition = 'margin-right 0.3s cubic-bezier(0.4, 0, 0.2, 1), width 0.3s cubic-bezier(0.4, 0, 0.2, 1)';

    function showUI() {
        if (!isVisible) {
            isVisible = true;
            sidebar.classList.add('active');
            
            // Create a local coordinate system for position:fixed elements
            // This forces fixed headers/bars to stay within the body
            document.body.style.transform = 'translate3d(0,0,0)';
            
            // Push and compress the body content
            document.body.style.width = 'calc(100% - 80px)';
            document.body.style.marginRight = '80px'; 
        }
        
        // Reset the timer whenever this function is called
        clearTimeout(hideTimer);
        hideTimer = setTimeout(hideUI, 5000); // 5 seconds
    }

    function hideUI() {
        // Only hide if the mouse is NOT hovering over the sidebar itself
        if (sidebar.matches(':hover')) {
            // Check again in 1 second
            hideTimer = setTimeout(hideUI, 1000);
            return;
        }

        isVisible = false;
        sidebar.classList.remove('active');
        
        // Restore website content width and context
        document.body.style.marginRight = '0px';
        document.body.style.width = '';

        // Wait for transition to finish before removing the containing block
        setTimeout(() => {
            if (!isVisible) {
                document.body.style.transform = '';
            }
        }, 300);
    }

    // --- 5. Event Listeners ---
    
    // Detect ANY mouse movement on the page
    document.addEventListener('mousemove', showUI);
    
    // Also show if we scroll or click
    document.addEventListener('scroll', showUI);
    document.addEventListener('click', showUI);

    // Initial check
    showUI();
}