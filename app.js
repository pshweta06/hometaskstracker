// App State
let currentUser = null;
let tasks = [];
let users = [];
let lastToggledId = null;

const DEFAULT_CSV_DATA = `Task ID,Room,Task,Frequency,Last Completed,,,Notes
1,Living + Dining,General Dusting,Weekly,2026-01-02,,,
2,Living + Dining,Vacuum sofa,Weekly,2026-01-02,,,
3,Living + Dining,Clean play mat,Weekly,2026-01-02,,,
4,Living + Dining,Spot-clean walls & fingerprints,Monthly,2026-01-02,,,
5,Living + Dining,Organise toys (living room and kids bedroom),Weekly,2026-01-02,,,
6,Living + Dining,Wipe windows & grilles (inside),Monthly,2026-01-02,,,
7,Living + Dining,Clean ceiling fans,Monthly,2026-01-02,,,
8,Living + Dining,Vacuum under sofa,Monthly,2026-01-02,,,
9,Living + Dining,Polish table,Monthly,2026-01-02,,,
10,Living + Dining,Refresh dehumidifers,Quarterly,2026-01-02,,,
11,Living + Dining,Air out shoes,Monthly,2026-01-02,,,
12,Living + Dining,Vacuum sofa,Weekly,2026-01-02,,,
13,Living + Dining,Replace cushion covers,Monthly,2026-01-02,,,
14,Living + Dining,Change doormat,Monthly,2026-01-02,,,
15,Living + Dining,Sweep the entrance,Weekly,2026-01-02,,,
16,Living + Dining,Vacuum curtains,Quarterly,2026-01-02,,,
17,Living + Dining,Replace ant bait,Quarterly,2026-01-02,,,
18,Kitchen,Wipe cabinet doors & handles,Weekly,2026-01-02,,,
19,Kitchen,"Wipe appliances: fridge, oven, kettle, rice cooker, blender, microwave etc",Weekly,2026-01-02,,,
20,Kitchen,Wash dish rack & sponge holder,Weekly,2026-01-02,,,
21,Kitchen,Replace kitchen cleaning cloth,Monthly,2026-01-02,,,
22,Kitchen,Clean fridge,Monthly,2026-01-02,,,
23,Kitchen,Deep-clean dishwasher,Monthly,2026-01-02,,,
24,Kitchen,"Deep-clean sink: clean strainer, drain cover, put Mr.Muscle",Weekly,2026-01-02,,,
25,Kitchen,Deep clean vessel holder and bottle dryer,Monthly,2026-01-02,,,
26,Kitchen,Deep clean stove hood filters & backsplash,Monthly,2026-01-02,,,
27,Kitchen,Declutter snacks cupboard,Weekly,2026-01-02,,,
28,Kitchen,Organise food pantry and remove expired food,Monthly,2026-01-02,,,
29,Kitchen,Deep clean stove and backsplash,Weekly,2026-01-02,,,
29,Yard,"Deep-clean sink: clean strainer, drain cover, put Mr.Muscle",Monthly,2026-01-02,,,
30,Yard,Wipe washing machine exterior,Weekly,2026-01-02,,,
31,Yard,Clean washer/dryer lint filter and water collector,Weekly,2026-01-02,,,
32,Yard,Deep clean washing machine,Quarterly,2026-01-02,,,
33,Yard,Clean sink pipe trap,Quarterly,2026-01-02,,,
34,Yard,Wash/ replace mop heads,Monthly,2026-01-02,,,
35,Yard,Wash broom and dustpan,Monthly,2026-01-02,,,
36,Yard,Clean vacuum dust holder,Monthly,2026-01-02,,,
37,Yard,Declutter yard area,Quarterly,2026-01-02,,,
38,Bathroom,Descale shower head & taps,Quarterly,2026-01-02,,,
39,Bathroom,Clean common bathroom,Weekly,2026-01-02,,,
40,Bathroom,Clean master bathroom,Weekly,2026-01-02,,,
41,Bathroom,Declutter toilettries area,Monthly,2026-01-02,,,
42,Bedrooms,Dust surfaces (bedside tables),Monthly,2026-01-02,,,
43,Bedrooms,Change bedsheets,Weekly,2026-01-02,,,
44,Bedrooms,Vacuum mattress,Weekly,2026-01-02,,,
45,Bedrooms,Wipe and declutter desk,Weekly,2026-01-02,,,
46,Bedrooms,Vacuum under desk and chair,Monthly,2026-01-02,,,
47,Bedrooms,Wash pillow protectors / mattress protector,Quarterly,2026-01-02,,,
48,Bedrooms,Vacuum under/behind bed,Quarterly,2026-01-02,,,
49,Bedrooms,Wipe down wardrobe doors,Quarterly,2026-01-02,,,
50,Bedrooms,Vacuum under bed / behind storage boxes,Monthly,2026-01-02,,,
51,Bedrooms,Separate outgrown kids clothes; bag donations,Quarterly,2026-01-02,,,
52,Living + Dining,"Remove trash from strollers, wipe down",Weekly,2026-01-02,,,
53,Whole House,Clean trash bins (rinse & dry),Monthly,2026-01-02,,,
54,Bedrooms,Wash and replace kids sleeping bag sheets from school,Weekly,2026-01-02,,,`;

// DOM Elements
const views = {
    login: document.getElementById('login-view'),
    signup: document.getElementById('signup-view'),
    userDashboard: document.getElementById('user-dashboard'),
    adminPanel: document.getElementById('admin-panel')
};

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    loadData();
    setupEventListeners();
    checkSession();
}

function loadData() {
    const savedTasks = localStorage.getItem('hometasks_tasks');
    if (savedTasks) {
        tasks = JSON.parse(savedTasks);
    } else {
        // First run: Import default data
        importCSV(DEFAULT_CSV_DATA);
    }
    
    const savedUsers = localStorage.getItem('hometasks_users');
    if (savedUsers) {
        users = JSON.parse(savedUsers);
    } else {
        users = [];
    }

    // Ensure default admin exists
    if (!users.some(u => u.username === 'admin')) {
        users.push({ username: 'admin', password: 'admin123', role: 'admin' });
        localStorage.setItem('hometasks_users', JSON.stringify(users));
    }

    const session = localStorage.getItem('hometasks_session');
    if (session) {
        currentUser = JSON.parse(session);
    }
}

function importCSV(csvString) {
    const lines = csvString.split('\n');
    const newTasks = [];
    
    // Skip header
    let monthlyCount = 0;
    let quarterlyCount = 0;

    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        
        // Simple CSV parser for quoted fields
        const parts = [];
        let current = "";
        let inQuotes = false;
        for (let char of lines[i]) {
            if (char === '"') inQuotes = !inQuotes;
            else if (char === ',' && !inQuotes) {
                parts.push(current);
                current = "";
            } else current += char;
        }
        parts.push(current);

        const id = Date.now() + i;
        const room = parts[1];
        const taskName = parts[2];
        const freq = parts[3];
        
        // Initial Staggering Logic
        let nextDue = new Date();
        nextDue.setHours(0, 0, 0, 0);

        if (freq === 'Monthly') {
            // Stagger across 4 weeks
            const weekOffset = monthlyCount % 4;
            nextDue.setDate(nextDue.getDate() + (weekOffset * 7));
            monthlyCount++;
        } else if (freq === 'Quarterly') {
            // Stagger across 12 weeks
            const weekOffset = quarterlyCount % 12;
            nextDue.setDate(nextDue.getDate() + (weekOffset * 7));
            quarterlyCount++;
        }

        newTasks.push({
            id: id,
            room: room,
            task: taskName,
            frequency: freq,
            lastCompleted: null,
            nextDue: nextDue.toISOString().split('T')[0],
            completedThisCycle: false
        });
    }
    
    tasks = newTasks;
    saveTasks();
}

function saveTasks() {
    localStorage.setItem('hometasks_tasks', JSON.stringify(tasks));
}

function checkSession() {
    if (currentUser) {
        showView(currentUser.role === 'admin' ? 'adminPanel' : 'userDashboard');
        updateUI();
    } else {
        showView('login');
    }
}

// --- Routing/View Management ---
function showView(viewName) {
    console.log("Showing view:", viewName);
    Object.keys(views).forEach(key => {
        if (views[key]) {
            views[key].classList.toggle('hidden', key !== viewName);
        } else {
            console.warn("View not found for key:", key);
        }
    });
}

// --- Auth Logic ---
function setupEventListeners() {
    // Login
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    
    // Sign Up
    document.getElementById('signup-form')?.addEventListener('submit', handleSignup);

    // Auth Toggles
    document.getElementById('show-signup')?.addEventListener('click', (e) => {
        e.preventDefault();
        showView('signup');
    });
    document.getElementById('show-login')?.addEventListener('click', (e) => {
        e.preventDefault();
        showView('login');
    });

    // Logout
    document.getElementById('logout-btn').addEventListener('click', handleLogout);

    // Navigation
    document.getElementById('go-to-admin')?.addEventListener('click', () => showView('adminPanel'));
    document.getElementById('back-to-dashboard')?.addEventListener('click', () => showView('userDashboard'));

    // Admin Actions
    document.getElementById('add-task-btn')?.addEventListener('click', openAddTaskModal);
    document.getElementById('import-csv-btn')?.addEventListener('click', () => {
        if (confirm("This will reset all your tasks and progress. Continue?")) {
            importCSV(DEFAULT_CSV_DATA);
            updateUI();
        }
    });
    document.getElementById('close-modal')?.addEventListener('click', closeModal);
    document.getElementById('task-form')?.addEventListener('submit', handleSaveTask);
    
    // User Actions
    document.getElementById('toggle-preview')?.addEventListener('click', togglePreview);
}

function handleLogin(e) {
    e.preventDefault();
    console.log("Login attempt...");
    const usernameInput = document.getElementById('username').value.toLowerCase().trim();
    const passwordInput = document.getElementById('password').value;
    const errorEl = document.getElementById('login-error');

    console.log("Looking for user:", usernameInput);
    const user = users.find(u => u.username === usernameInput && u.password === passwordInput);

    if (user) {
        console.log("User found:", user.username, "Role:", user.role);
        currentUser = { username: user.username, role: user.role };
        localStorage.setItem('hometasks_session', JSON.stringify(currentUser));
        errorEl.textContent = "";
        showView(currentUser.role === 'admin' ? 'adminPanel' : 'userDashboard');
        updateUI();
    } else {
        console.log("User not found or password incorrect");
        errorEl.textContent = "Invalid username or password";
    }
}

function handleSignup(e) {
    e.preventDefault();
    const username = document.getElementById('signup-username').value.toLowerCase().trim();
    const password = document.getElementById('signup-password').value;
    const errorEl = document.getElementById('signup-error');

    if (users.some(u => u.username === username)) {
        errorEl.textContent = "Username already exists";
        return;
    }

    const newUser = { username, password, role: 'user' };
    users.push(newUser);
    localStorage.setItem('hometasks_users', JSON.stringify(users));

    currentUser = { username: newUser.username, role: newUser.role };
    localStorage.setItem('hometasks_session', JSON.stringify(currentUser));
    
    errorEl.textContent = "";
    showView('userDashboard');
    updateUI();
}

function handleLogout() {
    currentUser = null;
    localStorage.removeItem('hometasks_session');
    showView('login');
}

// --- UI Updates ---
function updateUI() {
    if (!currentUser) return;

    document.getElementById('display-name').textContent = `Hello, ${currentUser.username}`;
    document.getElementById('admin-link-container').classList.toggle('hidden', currentUser.role !== 'admin');

    if (currentUser.role === 'admin') {
        renderAdminTable();
    }
    
    renderUserDashboard();
}

// Placeholder functions for next steps
function renderUserDashboard() {
    const today = new Date();
    const startOfWeek = getStartOfWeek(today);
    const endOfWeek = getEndOfWeek(today);
    const startOfNextWeek = new Date(startOfWeek);
    startOfNextWeek.setDate(startOfNextWeek.getDate() + 7);
    const endOfNextWeek = new Date(endOfWeek);
    endOfNextWeek.setDate(endOfNextWeek.getDate() + 7);

    // Reset completion status for tasks that were completed in a PREVIOUS week
    tasks.forEach(t => {
        if (t.completedThisCycle && t.lastCompleted) {
            const lastComp = new Date(t.lastCompleted);
            if (lastComp < startOfWeek) {
                t.completedThisCycle = false;
            }
        }
    });

    // Delayed: nextDue is in the past AND it wasn't completed this week
    const delayedTasks = tasks.filter(t => {
        const due = new Date(t.nextDue);
        const wasDoneThisWeek = t.completedThisCycle && t.lastCompleted && new Date(t.lastCompleted) >= startOfWeek;
        
        if (wasDoneThisWeek) return false;
        return due < startOfWeek;
    });

    // Current: nextDue is this week OR it was completed this week
    const currentTasks = tasks.filter(t => {
        const due = new Date(t.nextDue);
        const wasDoneThisWeek = t.completedThisCycle && t.lastCompleted && new Date(t.lastCompleted) >= startOfWeek;
        
        if (wasDoneThisWeek) return true;
        return due >= startOfWeek && due <= endOfWeek;
    });

    const previewTasks = tasks.filter(t => {
        const due = new Date(t.nextDue);
        return due > endOfWeek && due <= endOfNextWeek;
    }).map(t => ({...t, completedThisCycle: false}));

    renderTaskList('delayed-tasks-list', delayedTasks, true);
    renderTaskList('current-tasks-list', currentTasks, false);
    renderTaskList('preview-tasks-list', previewTasks, false);

    const delayedContainer = document.getElementById('delayed-tasks-container');
    if (delayedContainer) {
        delayedContainer.classList.toggle('hidden', delayedTasks.length === 0);
        const h2 = delayedContainer.querySelector('h2');
        if (h2) h2.innerHTML = `<span>⚠️</span> Delayed Tasks`;
    }
    
    updateProgressBar(currentTasks, delayedTasks);
}

function renderTaskList(elementId, taskList, isDelayed) {
    const container = document.getElementById(elementId);
    if (!container) return;

    if (taskList.length === 0) {
        container.innerHTML = `<li class="task-item no-tasks">No tasks in this category</li>`;
        return;
    }

    // Sort: Uncompleted first, then Completed. 
    // Within those: Frequency (Weekly > Monthly > Quarterly), then Room, then Task name.
    const freqPriority = { 'Weekly': 1, 'Monthly': 2, 'Quarterly': 3 };
    
    const sorted = [...taskList].sort((a, b) => {
        if (a.completedThisCycle !== b.completedThisCycle) {
            return a.completedThisCycle ? 1 : -1;
        }
        if (a.frequency !== b.frequency) {
            return (freqPriority[a.frequency] || 99) - (freqPriority[b.frequency] || 99);
        }
        if (a.room !== b.room) {
            return a.room.localeCompare(b.room);
        }
        return a.task.localeCompare(b.task);
    });

    // Group by Room
    const groups = {};
    sorted.forEach(t => {
        if (!groups[t.room]) groups[t.room] = [];
        groups[t.room].push(t);
    });

    let html = '';
    for (const room in groups) {
        html += `<div class="room-group">
            <h3 class="room-title">${room}</h3>
            <ul class="room-task-list">
                ${groups[room].map(t => {
                    const isJustToggled = t.id === lastToggledId;
                    const animClass = isJustToggled ? (t.completedThisCycle ? 'anim-move-down' : 'anim-move-up') : '';
                    
                    return `
                        <li class="task-item ${t.completedThisCycle ? 'task-done' : ''} ${animClass}">
                            <input type="checkbox" ${t.completedThisCycle ? 'checked' : ''} onchange="handleToggleTask(${t.id})">
                            <div class="task-info">
                                <div class="task-name ${t.completedThisCycle ? 'completed' : ''}">${t.task}</div>
                                <div class="task-meta">
                                    ${t.frequency}
                                    ${isDelayed ? '<span class="tag tag-delayed">Delayed</span>' : ''}
                                </div>
                            </div>
                        </li>
                    `;
                }).join('')}
            </ul>
        </div>`;
    }

    container.innerHTML = html;
}

function updateProgressBar(current, delayed) {
    const total = current.length + delayed.length;
    if (total === 0) {
        document.getElementById('progress-fill').style.width = "100%";
        return;
    }

    const completed = [...current, ...delayed].filter(t => t.completedThisCycle).length;
    const percentage = Math.round((completed / total) * 100);
    document.getElementById('progress-fill').style.width = `${percentage}%`;
}
function renderAdminTable() {
    const tableBody = document.getElementById('admin-task-table-body');
    if (!tableBody) return;

    const freqPriority = { 'Weekly': 1, 'Monthly': 2, 'Quarterly': 3 };
    const sortedTasks = [...tasks].sort((a, b) => {
        if (a.room !== b.room) return a.room.localeCompare(b.room);
        if (a.frequency !== b.frequency) return (freqPriority[a.frequency] || 99) - (freqPriority[b.frequency] || 99);
        return a.task.localeCompare(b.task);
    });

    tableBody.innerHTML = sortedTasks.map(t => `
        <tr>
            <td>${t.room}</td>
            <td>${t.task}</td>
            <td><span class="tag tag-freq">${t.frequency}</span></td>
            <td>${t.nextDue}</td>
            <td>
                <div class="action-btns">
                    <button class="btn-edit" onclick="editTask(${t.id})">Edit</button>
                    <button class="btn-delete" onclick="deleteTask(${t.id})">Delete</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function populateRoomDropdown() {
    const roomSelect = document.getElementById('task-room');
    if (!roomSelect) return;

    // Get unique rooms from current tasks
    const rooms = [...new Set(tasks.map(t => t.room))].sort();
    
    roomSelect.innerHTML = rooms.map(room => 
        `<option value="${room}">${room}</option>`
    ).join('');
}

function openAddTaskModal() {
    document.getElementById('modal-title').textContent = "Add New Task";
    document.getElementById('task-form').reset();
    populateRoomDropdown();
    document.getElementById('edit-task-id').value = "";
    document.getElementById('task-modal').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('task-modal').classList.add('hidden');
}

function handleSaveTask(e) {
    e.preventDefault();
    const id = document.getElementById('edit-task-id').value;
    const room = document.getElementById('task-room').value;
    const taskName = document.getElementById('task-desc').value;
    const freq = document.getElementById('task-freq').value;

    if (id) {
        // Update
        const task = tasks.find(t => t.id == id);
        if (task) {
            task.room = room;
            task.task = taskName;
            task.frequency = freq;
        }
    } else {
        // Create
        const newTask = {
            id: Date.now(),
            room: room,
            task: taskName,
            frequency: freq,
            lastCompleted: null,
            nextDue: new Date().toISOString().split('T')[0],
            completedThisCycle: false
        };
        tasks.push(newTask);
    }

    saveTasks();
    updateUI();
    closeModal();
}

function editTask(id) {
    const task = tasks.find(t => t.id == id);
    if (!task) return;

    document.getElementById('modal-title').textContent = "Edit Task";
    document.getElementById('edit-task-id').value = task.id;
    populateRoomDropdown();
    document.getElementById('task-room').value = task.room;
    document.getElementById('task-desc').value = task.task;
    document.getElementById('task-freq').value = task.frequency;
    
    document.getElementById('task-modal').classList.remove('hidden');
}

function deleteTask(id) {
    if (confirm("Are you sure you want to delete this task?")) {
        tasks = tasks.filter(t => t.id != id);
        saveTasks();
        updateUI();
    }
}

function togglePreview() {
    const container = document.getElementById('preview-tasks-container');
    const btn = document.getElementById('toggle-preview');
    const isHidden = container.classList.toggle('hidden');
    btn.textContent = isHidden ? "Show Next Week Preview" : "Hide Next Week Preview";
}

// --- Task Logic Engine ---

function getStartOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
}

function getEndOfWeek(date) {
    const d = getStartOfWeek(date);
    d.setDate(d.getDate() + 6);
    d.setHours(23, 59, 59, 999);
    return d;
}

function calculateNextDueDate(lastCompleted, frequency) {
    const d = new Date(lastCompleted);
    if (frequency === 'Weekly') {
        d.setDate(d.getDate() + 7);
    } else if (frequency === 'Monthly') {
        d.setMonth(d.getMonth() + 1);
    } else if (frequency === 'Quarterly') {
        d.setMonth(d.getMonth() + 3);
    }
    return d.toISOString().split('T')[0];
}

function handleToggleTask(id) {
    const task = tasks.find(t => t.id == id);
    if (!task) return;

    lastToggledId = id; // Track the task being moved for animation

    if (!task.completedThisCycle) {
        // Marking as completed
        task._prevNextDue = task.nextDue; 
        task.completedThisCycle = true;
        task.lastCompleted = new Date().toISOString().split('T')[0];
        task.nextDue = calculateNextDueDate(task.lastCompleted, task.frequency);
        
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#4a90e2', '#2ecc71', '#ff5e5e', '#f1c40f']
        });
    } else {
        // Unmarking
        task.completedThisCycle = false;
        if (task._prevNextDue) {
            task.nextDue = task._prevNextDue;
            delete task._prevNextDue;
        }
        task.lastCompleted = null;
    }

    saveTasks();
    
    // Brief delay before re-rendering to let the checkbox toggle visually
    // and then trigger the "move to bottom" animation
    setTimeout(() => {
        updateUI();
        // Clear the animation ID after a while so it doesn't re-trigger on other updates
        setTimeout(() => { lastToggledId = null; }, 1000);
    }, 150);
}

