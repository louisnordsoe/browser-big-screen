// Default Data
const defaultApps = [
    { id: '1', title: "YouTube", url: "https://www.youtube.com", icon: "https://cdn-icons-png.flaticon.com/512/1384/1384060.png" },
    { id: '2', title: "Netflix", url: "https://www.netflix.com", icon: "https://cdn-icons-png.flaticon.com/512/732/732228.png" }
];

let apps = [];
let contextTargetId = null;

// DOM Elements
const grid = document.getElementById('app-grid');
const contextMenu = document.getElementById('context-menu');
const modalOverlay = document.getElementById('modal-overlay');

// --- Initialization ---
function init() {
    chrome.storage.local.get(['apps'], (result) => {
        if (result.apps && result.apps.length > 0) {
            apps = result.apps;
            render();
        } else {
            // CRITICAL FIX: If storage is empty, use defaults AND SAVE THEM immediately
            apps = defaultApps;
            chrome.storage.local.set({ apps: defaultApps }, () => {
                render();
            });
        }
    });
}

// Start immediately
init();

// --- Rendering ---
function render() {
    grid.innerHTML = '';

    apps.forEach(app => {
        const card = document.createElement('div');
        card.className = 'card';
        // Fallback for broken images
        const iconUrl = app.icon || 'https://cdn-icons-png.flaticon.com/512/1006/1006771.png';
        
        card.innerHTML = `
            <img src="${iconUrl}" onerror="this.src='https://cdn-icons-png.flaticon.com/512/1006/1006771.png'">
            <h3>${app.title}</h3>
        `;

        card.onclick = () => window.location.href = app.url;

        card.oncontextmenu = (e) => {
            e.preventDefault();
            contextTargetId = app.id;
            contextMenu.style.display = 'block';
            contextMenu.style.left = `${e.pageX}px`;
            contextMenu.style.top = `${e.pageY}px`;
        };

        grid.appendChild(card);
    });

    // Add Button
    const addCard = document.createElement('div');
    addCard.className = 'card add-card';
    addCard.innerHTML = `<span class="add-icon">+</span><h3>Add App</h3>`;
    addCard.onclick = openAddModal;
    grid.appendChild(addCard);
}

// --- Context Menu ---
document.addEventListener('click', () => contextMenu.style.display = 'none');

document.getElementById('ctx-delete').onclick = () => {
    if(confirm('Delete this app?')) {
        apps = apps.filter(a => a.id !== contextTargetId);
        saveAndRender();
    }
};

document.getElementById('ctx-edit').onclick = () => {
    const app = apps.find(a => a.id === contextTargetId);
    if(app) openEditModal(app);
};

// --- Modal Logic ---
const btnSave = document.getElementById('btn-save');
const btnCancel = document.getElementById('btn-cancel');

function openAddModal() {
    document.getElementById('modal-title').innerText = 'Add App';
    document.getElementById('app-id').value = '';
    document.getElementById('app-title').value = '';
    document.getElementById('app-url').value = '';
    document.getElementById('app-icon').value = '';
    modalOverlay.classList.remove('hidden');
}

function openEditModal(app) {
    document.getElementById('modal-title').innerText = 'Edit App';
    document.getElementById('app-id').value = app.id;
    document.getElementById('app-title').value = app.title;
    document.getElementById('app-url').value = app.url;
    document.getElementById('app-icon').value = app.icon;
    modalOverlay.classList.remove('hidden');
}

btnCancel.onclick = () => modalOverlay.classList.add('hidden');

btnSave.onclick = () => {
    const id = document.getElementById('app-id').value;
    const title = document.getElementById('app-title').value;
    const url = document.getElementById('app-url').value;
    const icon = document.getElementById('app-icon').value;

    if (!title || !url) return alert("Title and URL required");

    if (id) {
        const index = apps.findIndex(a => a.id === id);
        if (index > -1) apps[index] = { id, title, url, icon };
    } else {
        apps.push({ id: Date.now().toString(), title, url, icon });
    }

    saveAndRender();
    modalOverlay.classList.add('hidden');
};

function saveAndRender() {
    chrome.storage.local.set({ apps }, render);
}