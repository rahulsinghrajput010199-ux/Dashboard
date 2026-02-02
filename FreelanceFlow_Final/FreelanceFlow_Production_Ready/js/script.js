document.addEventListener('DOMContentLoaded', () => {
    // --- User Profile & Welcome Initialization ---
    function updateGlobalUserProfile() {
        const storedSettings = JSON.parse(localStorage.getItem('userSettings') || '{}');
        const firstName = storedSettings.firstName || 'Rahul';
        const lastName = storedSettings.lastName || 'singh';
        const fullName = `${firstName} ${lastName}`.trim();

        // Update User Name globally
        document.querySelectorAll('.user-name').forEach(el => {
            el.textContent = fullName;
        });

        // Update Welcome Message (Dashboard only)
        const userWelcome = document.getElementById('userWelcome');
        if (userWelcome) {
            userWelcome.textContent = `Welcome back, ${firstName}! 👋`;
        }

        // Update Avatar globally
        const storedAvatar = localStorage.getItem('userAvatar');
        if (storedAvatar) {
            document.querySelectorAll('.user-profile img, .sidebar-header img, .avatar').forEach(img => {
                if (img.id !== 'settingsProfileImg') img.src = storedAvatar;
            });
        }

        // Update Dropdown Header if it exists
        const dropdownHeader = document.querySelector('#profileDropdown .dropdown-user-info');
        if (dropdownHeader) {
            dropdownHeader.textContent = fullName;
        }
    }

    // Run instantly on load
    updateGlobalUserProfile();
    // --- Theme Toggling ---
    const themeToggleBtn = document.getElementById('theme-toggle');
    const body = document.body;
    const currentTheme = localStorage.getItem('theme');

    if (currentTheme) {
        body.setAttribute('data-theme', currentTheme);
        updateThemeIcon(currentTheme);
    }

    themeToggleBtn.addEventListener('click', () => {
        let theme = body.getAttribute('data-theme');
        if (theme === 'dark') {
            body.removeAttribute('data-theme');
            localStorage.setItem('theme', 'light');
            updateThemeIcon('light');
        } else {
            body.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
            updateThemeIcon('dark');
        }
    });

    function updateThemeIcon(theme) {
        const icon = themeToggleBtn.querySelector('i');
        if (theme === 'dark') {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        } else {
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
        }
    }

    // --- Sidebar Toggling ---
    const sidebar = document.querySelector('.sidebar');
    const toggleSidebarBtn = document.getElementById('toggle-sidebar');
    const sidebarOverlay = document.createElement('div');
    sidebarOverlay.className = 'sidebar-overlay';
    document.body.appendChild(sidebarOverlay);

    if (toggleSidebarBtn) {
        toggleSidebarBtn.addEventListener('click', () => {
            sidebar.classList.toggle('active');
            sidebarOverlay.classList.toggle('active');
        });
    }

    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', () => {
            sidebar.classList.remove('active');
            sidebarOverlay.classList.remove('active');
        });
    }

    // Close sidebar on mobile when nav link clicked
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 1024) {
                sidebar.classList.remove('active');
                sidebarOverlay.classList.remove('active');
            }
        });
    });

    // --- Data Initialization ---

    // --- Global Data Helpers ---
    function getSafeData(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            return [];
        }
    }

    function escapeHTML(str) {
        if (!str) return str;
        return str.toString()
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // --- Global Data Loading ---
    let clients = getSafeData('clients');
    let projects = getSafeData('projects');
    let invoices = getSafeData('invoices');
    let timeEntries = getSafeData('timeEntries');

    // --- Client Logic ---
    const modal = document.getElementById('addClientModal');
    const openModalBtn = document.getElementById('openModalBtn');
    const closeMetric = document.querySelector('.close-modal');
    const closeBtn = document.querySelector('.close-modal-btn');
    const form = document.getElementById('addClientForm');
    const clientTableBody = document.getElementById('clientsTableBody');

    // 2. Render Clients
    function renderClients(searchQuery = '') {
        if (!clientTableBody) return;
        clientTableBody.innerHTML = '';

        const currentClients = getSafeData('clients');
        const currentInvoices = getSafeData('invoices');
        const currentProjects = getSafeData('projects');

        if (currentClients.length === 0) {
            clientTableBody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 2rem; color: var(--text-muted);">
                        No clients found. Add a new client to get started.
                    </td>
                </tr>`;
            return;
        }

        currentClients.forEach((client, index) => {
            if (!client || !client.name) return; // Skip invalid data

            // Filter by Search
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const match = client.name.toLowerCase().includes(query) ||
                    (client.email || '').toLowerCase().includes(query) ||
                    (client.note || '').toLowerCase().includes(query);
                if (!match) return;
            }

            // Generate Status Badge
            let statusBadge = '';
            if (client.status === 'active') statusBadge = '<span class="status-badge status-active">Active</span>';
            else if (client.status === 'onboarding') statusBadge = '<span class="status-badge status-pending">Onboarding</span>';
            else statusBadge = '<span class="status-badge status-inactive">Inactive</span>';

            // Calculate Earnings & Projects
            const clientPaid = currentInvoices.filter(inv => inv.client === client.name && inv.status === 'paid');
            const totalEarnings = clientPaid.reduce((sum, inv) => {
                const amt = parseFloat(inv.amount);
                return sum + (isNaN(amt) ? 0 : amt);
            }, 0);
            const clientProjects = currentProjects.filter(p => p.client === client.name);

            // Safe Avatar Name
            const avatarName = encodeURIComponent(client.name);

            const row = document.createElement('tr');
            row.innerHTML = `
                <td style="display:flex; align-items:center; gap:0.75rem;">
                    <img src="https://ui-avatars.com/api/?name=${avatarName}&background=random" 
                         style="width:32px; height:32px; border-radius:50%;" alt="">
                    <div>${escapeHTML(client.name)}</div>
                </td>
                <td>${escapeHTML(client.email) || '-'}</td>
                <td>${escapeHTML(client.country) || '-'} 🏳️</td>
                <td style="max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--text-muted);" title="${escapeHTML(client.note || '')}">
                    ${escapeHTML(client.note) || '-'}
                </td>
                <td>${clientProjects.length}</td>
                <td>$${totalEarnings.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                <td>${statusBadge}</td>
                <td><button class="action-btn" data-index="${index}"><i class="fa-solid fa-ellipsis-vertical"></i></button></td>
            `;
            clientTableBody.appendChild(row);
        });
        // Sync global clients variable to ensure action dropdown stays updated
        clients = currentClients;
    }

    // Client Search Logic (moved to global search handler or kept local if unique)
    const clientSearchInput = document.getElementById('clientSearchInput');
    if (clientSearchInput) {
        clientSearchInput.addEventListener('input', (e) => {
            renderClients(e.target.value);
        });
    }

    // Initial Render
    if (clientTableBody) renderClients();

    if (modal && openModalBtn) {
        openModalBtn.addEventListener('click', () => {
            if (dropdown) dropdown.editingIndex = null;
            const modalTitle = document.querySelector('#addClientModal h2');
            const modalBtn = document.querySelector('#addClientModal .btn-primary');
            if (modalTitle) modalTitle.textContent = 'Add New Client';
            if (modalBtn) modalBtn.textContent = 'Add Client';
            if (form) form.reset();
            modal.style.display = 'flex';
            setTimeout(() => modal.classList.add('show'), 10);
        });

        function closeModal() {
            modal.classList.remove('show');
            setTimeout(() => modal.style.display = 'none', 300);
            if (form) form.reset();
        }

        if (closeMetric) closeMetric.addEventListener('click', closeModal);
        if (closeBtn) closeBtn.addEventListener('click', closeModal);

        window.addEventListener('click', (e) => {
            if (e.target == modal) closeModal();
        });

        // Add New Client Logic
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();

                // Get form values
                const name = document.getElementById('clientName').value;
                const email = document.getElementById('clientEmail').value;
                const country = document.getElementById('clientCountry').value;
                const status = document.getElementById('clientStatus').value;
                const note = document.getElementById('clientNote').value;

                if (dropdown && dropdown.editingIndex !== undefined && dropdown.editingIndex !== null) {
                    // Update
                    const index = dropdown.editingIndex;
                    clients[index] = {
                        ...clients[index],
                        name,
                        email,
                        country,
                        status,
                        note
                    };
                    dropdown.editingIndex = null;
                    alert('Client updated successfully!');
                } else {
                    // Create New
                    const newClient = {
                        name,
                        email,
                        country,
                        status,
                        note,
                        dateAdded: new Date().toISOString()
                    };
                    clients.unshift(newClient);
                    alert('Client saved successfully!');
                }

                // Save to Storage
                localStorage.setItem('clients', JSON.stringify(clients));

                // Re-render
                renderClients();

                // Show Success & Close
                closeModal();
            });
        }
    }

    // --- Action Dropdown Logic & Client Removal ---
    const dropdown = document.getElementById('actionDropdown');

    if (dropdown) {
        // Event Delegation for Action Buttons (handles dynamic rows)
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('.action-btn');

            if (btn && dropdown) {
                e.stopPropagation();

                // Close if clicking the same button active
                if (dropdown.style.display === 'block' && dropdown.activeBtn === btn) {
                    hideDropdown();
                    return;
                }

                // Store reference to the row for removal action
                dropdown.activeRow = btn.closest('tr');
                dropdown.activeBtn = btn;

                // Position dropdown
                const rect = btn.getBoundingClientRect();
                const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

                dropdown.style.top = (rect.bottom + scrollTop + 5) + 'px';
                dropdown.style.left = (rect.left - 100) + 'px';
                dropdown.style.display = 'block';

                // Active state
                document.querySelectorAll('.action-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            } else if (dropdown && !e.target.closest('.action-dropdown')) {
                // Click outside dropdown and button -> hide
                hideDropdown();
            }
        });

        // Handle "Remove Client" action
        const removeLink = dropdown.querySelector('.text-danger');
        if (removeLink) {
            removeLink.addEventListener('click', (e) => {
                e.preventDefault();
                if (dropdown.activeBtn) {
                    const index = dropdown.activeBtn.getAttribute('data-index');
                    if (index !== null) {
                        const client = clients[index];
                        if (confirm('Are you sure you want to remove client: ' + client.name + '?')) {
                            // Remove from Array
                            clients.splice(index, 1);
                            // Update Storage
                            localStorage.setItem('clients', JSON.stringify(clients));
                            // Re-render
                            renderClients();
                            hideDropdown();
                            updateDashboard();
                        }
                    }
                }
            });
        }

        // Handle "Edit Details" action
        const editLink = dropdown.querySelector('li:nth-child(2) a');
        if (editLink) {
            editLink.addEventListener('click', (e) => {
                e.preventDefault();
                if (dropdown.activeBtn) {
                    const index = dropdown.activeBtn.getAttribute('data-index');
                    if (index !== null) {
                        const client = clients[index];
                        if (client) {
                            // Populate Form
                            document.getElementById('clientName').value = client.name;
                            document.getElementById('clientEmail').value = client.email;
                            document.getElementById('clientCountry').value = client.country;
                            document.getElementById('clientStatus').value = client.status;
                            document.getElementById('clientNote').value = client.note || '';

                            // Update UI
                            document.querySelector('#addClientModal h2').textContent = 'Edit Client';
                            document.querySelector('#addClientModal .btn-primary').textContent = 'Update Client';

                            dropdown.editingIndex = index;

                            // Show Modal
                            modal.style.display = 'flex';
                            setTimeout(() => modal.classList.add('show'), 10);
                            hideDropdown();
                        }
                    }
                }
            });
        }

        // Handle "Send Email" action
        const emailLink = dropdown.querySelector('.send-email-link');
        if (emailLink) {
            emailLink.addEventListener('click', (e) => {
                e.preventDefault();
                if (dropdown.activeBtn) {
                    const index = dropdown.activeBtn.getAttribute('data-index');
                    if (index !== null && index !== undefined && index !== '') {
                        const client = clients[index];
                        if (client && client.email && client.email.trim() !== '' && client.email !== '-') {
                            const email = client.email.trim();
                            console.log(`Launching Gmail for: ${email}`);
                            // Direct Gmail composition link in a new tab
                            const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}`;
                            window.open(gmailUrl, '_blank');
                        } else {
                            alert('No valid email address found for this client. Please update the client details.');
                        }
                        hideDropdown();
                    }
                }
            });
        }

        // Handle "Create Invoice" action
        const createInvoiceLink = dropdown.querySelector('.create-invoice-link');
        if (createInvoiceLink) {
            createInvoiceLink.addEventListener('click', (e) => {
                e.preventDefault();
                if (dropdown.activeBtn) {
                    const index = dropdown.activeBtn.getAttribute('data-index');
                    if (index !== null) {
                        const client = clients[index];
                        // Redirect to invoices page with client name as query param
                        window.location.href = `invoices.html?client=${encodeURIComponent(client.name)}`;
                    }
                }
            });
        }

        function hideDropdown() {
            dropdown.style.display = 'none';
            if (dropdown.activeBtn) dropdown.activeBtn.classList.remove('active');
            dropdown.activeBtn = null;
        }

        // Hide on scroll to prevent floating weirdly
        window.addEventListener('scroll', hideDropdown, true);
    }

    // --- Project Page Logic (Modal & Actions) ---
    const projectModal = document.getElementById('addProjectModal');
    const openProjectBtn = document.getElementById('openProjectModalBtn');
    const projectForm = document.getElementById('addProjectForm');
    const projectsGrid = document.getElementById('projectsGrid');
    let editingProjectIndex = null; // Track index in array

    // 2. Render Projects
    function renderProjects() {
        if (!projectsGrid) return;

        // Clear Grid (except the empty state if zero projects, but easier to rebuild all)
        // If projects is empty, show empty state
        if (projects.length === 0) {
            projectsGrid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 4rem; color: var(--text-muted); background: var(--bg-card); border-radius: 12px; border: 1px solid var(--border-color);">
                    <i class="fa-solid fa-folder-open" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                    <p>No projects yet. Create a new project to start tracking.</p>
                </div>`;
            return;
        }

        projectsGrid.innerHTML = ''; // Clear for rebuild

        projects.forEach((proj, index) => {
            // Status Badge
            let statusBadge = '';
            if (proj.status === 'active') statusBadge = '<span class="status-badge status-active">In Progress</span>';
            else if (proj.status === 'pending') statusBadge = '<span class="status-badge status-pending">Planning</span>';
            else if (proj.status === 'review') statusBadge = '<span class="status-badge status-active">Review</span>';
            else statusBadge = '<span class="status-badge status-inactive">Completed</span>';

            const initials = proj.client.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

            // Note: Storing index in data-index for actions
            const cardHTML = `
                <div class="card" data-index="${index}">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
                        ${statusBadge}
                        <button class="action-btn project-action-btn"><i class="fa-solid fa-ellipsis"></i></button>
                    </div>
                    <h3 class="card-title" style="margin-bottom: 0.5rem;">${proj.name}</h3>
                    <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 0.5rem;">${proj.client}</p>
                    ${proj.note ? `<p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1rem; font-style: italic; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${proj.note}</p>` : ''}

                    <div style="margin-bottom: 1.5rem;">
                        <div class="project-info">
                            <span>Progress</span>
                            <span>${proj.progress}%</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${proj.progress}%; background-color: var(--primary-color);"></div>
                        </div>
                    </div>

                    <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-color); padding-top: 1rem;">
                        <div style="display: flex; align-items: center; gap: 0.5rem; color: var(--text-muted); font-size: 0.85rem;">
                            <i class="fa-regular fa-clock"></i> Due: ${proj.deadline}
                        </div>
                        <div style="display: flex;">
                             <img src="https://ui-avatars.com/api/?name=${initials}&background=random" 
                                 style="width:24px; height:24px; border-radius:50%; border:2px solid var(--bg-card); margin-left: -8px;" alt="">
                        </div>
                    </div>
                </div>
            `;
            projectsGrid.insertAdjacentHTML('beforeend', cardHTML);
        });
    }

    // Initial Render
    if (projectsGrid) renderProjects();

    if (projectModal && openProjectBtn) {
        // Open Modal
        openProjectBtn.addEventListener('click', () => {
            editingProjectIndex = null;
            document.querySelector('#addProjectModal h2').textContent = 'Create New Project';
            const submitBtn = document.querySelector('#addProjectModal .btn-primary');
            if (submitBtn) submitBtn.textContent = 'Create Project';
            if (projectForm) projectForm.reset();

            projectModal.style.display = 'flex';
            setTimeout(() => projectModal.classList.add('show'), 10);
        });

        // Close Logic
        const closeProjectMetric = projectModal.querySelector('.close-modal');
        const closeProjectBtn = projectModal.querySelector('.close-modal-btn');
        const closeProjectModal = () => {
            projectModal.classList.remove('show');
            setTimeout(() => projectModal.style.display = 'none', 300);
            if (projectForm) projectForm.reset();
            editingProjectIndex = null;
        };

        if (closeProjectMetric) closeProjectMetric.addEventListener('click', closeProjectModal);
        if (closeProjectBtn) closeProjectBtn.addEventListener('click', closeProjectModal);

        window.addEventListener('click', (e) => {
            if (e.target == projectModal) closeProjectModal();
        });

        // Submit Logic (Add/Edit)
        if (projectForm) {
            projectForm.addEventListener('submit', (e) => {
                e.preventDefault();

                const name = projectForm.querySelectorAll('input')[0].value;
                const client = projectForm.querySelector('select').value; // First select is client
                const deadline = projectForm.querySelectorAll('input')[1].value;
                const status = projectForm.querySelectorAll('select')[1].value; // Second select is status
                const progress = projectForm.querySelectorAll('input')[2].value;
                const note = projectForm.querySelector('textarea').value;

                const newProject = {
                    name,
                    client,
                    deadline,
                    status,
                    progress,
                    note
                };

                if (editingProjectIndex !== null) {
                    // Update
                    projects[editingProjectIndex] = newProject;
                } else {
                    // Add
                    projects.unshift(newProject);
                }

                // Save & Render
                localStorage.setItem('projects', JSON.stringify(projects));
                renderProjects();
                closeProjectModal();
                alert('Project saved successfully!');
            });
        }
    }

    // Project Dropdown Logic
    const projectDropdown = document.getElementById('projectActionDropdown');

    if (projectDropdown) {
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('.project-action-btn');

            if (btn) {
                e.stopPropagation();
                // Close if clicking same
                if (projectDropdown.style.display === 'block' && projectDropdown.activeBtn === btn) {
                    hideProjectDropdown();
                    return;
                }

                // Get Index from Card
                const card = btn.closest('.card');
                const index = card.getAttribute('data-index');

                projectDropdown.activeIndex = index;
                projectDropdown.activeBtn = btn;

                const rect = btn.getBoundingClientRect();
                const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

                projectDropdown.style.top = (rect.bottom + scrollTop + 5) + 'px';
                projectDropdown.style.left = (rect.left - 100) + 'px';
                projectDropdown.style.display = 'block';

                document.querySelectorAll('.action-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            } else if (!e.target.closest('.action-dropdown')) {
                hideProjectDropdown();
            }
        });

        // Edit
        const editLink = projectDropdown.querySelector('li:first-child a');
        if (editLink) {
            editLink.addEventListener('click', (e) => {
                e.preventDefault();
                if (projectDropdown.activeIndex !== null) {
                    const index = parseInt(projectDropdown.activeIndex);
                    const proj = projects[index];
                    editingProjectIndex = index;

                    // Fill Form
                    document.querySelector('#addProjectModal h2').textContent = 'Edit Project';
                    const submitBtn = document.querySelector('#addProjectModal .btn-primary');
                    if (submitBtn) submitBtn.textContent = 'Save Changes';

                    const inputs = projectForm.querySelectorAll('input');
                    inputs[0].value = proj.name;
                    inputs[1].value = proj.deadline; // Date input format yyyy-mm-dd matches value
                    inputs[2].value = proj.progress;

                    const selects = projectForm.querySelectorAll('select');
                    // Helper to select option by text or value
                    const setSelect = (sel, val) => {
                        for (let i = 0; i < sel.options.length; i++) {
                            if (sel.options[i].value === val || sel.options[i].text === val) {
                                sel.selectedIndex = i;
                                break;
                            }
                        }
                    };
                    setSelect(selects[0], proj.client);
                    setSelect(selects[1], proj.status);

                    projectForm.querySelector('textarea').value = proj.note || '';

                    projectModal.style.display = 'flex';
                    setTimeout(() => projectModal.classList.add('show'), 10);
                    hideProjectDropdown();
                }
            });
        }

        // Delete
        const deleteLink = projectDropdown.querySelector('.text-danger');
        if (deleteLink) {
            deleteLink.addEventListener('click', (e) => {
                e.preventDefault();
                if (projectDropdown.activeIndex !== null) {
                    if (confirm('Delete this project?')) {
                        const index = parseInt(projectDropdown.activeIndex);
                        projects.splice(index, 1);
                        localStorage.setItem('projects', JSON.stringify(projects));
                        renderProjects();
                        hideProjectDropdown();
                    }
                }
            });
        }

        function hideProjectDropdown() {
            projectDropdown.style.display = 'none';
            if (projectDropdown.activeBtn) projectDropdown.activeBtn.classList.remove('active');
            projectDropdown.activeBtn = null;
            projectDropdown.activeIndex = null;
        }
        window.addEventListener('scroll', hideProjectDropdown, true);
    }

    // --- Invoice Logic ---
    const invoiceModal = document.getElementById('addInvoiceModal');
    const viewInvoiceModal = document.getElementById('viewInvoiceModal');
    const invoiceBtn = document.getElementById('openInvoiceModalBtn');
    const invoiceForm = document.getElementById('addInvoiceForm');
    const invoiceTableBody = document.getElementById('invoiceTableBody');
    const invoiceActionDropdown = document.getElementById('invoiceActionDropdown');
    const invoiceSearchInput = document.getElementById('invoiceSearchInput');

    // --- 1. Load Data (Mock DB) ---
    // If no data in localStorage, initialize with EMPTY array (Clean Slate)

    if (invoices.length === 0 && !localStorage.getItem('dataInitialized')) {
        // First run cleanup: Do NOT populate with dummy data.
        localStorage.setItem('dataInitialized', 'true');
    } if (invoiceTableBody) {

        // Render Invoices
        function renderInvoices(filter = 'all', searchQuery = '') {
            const currentInvoices = getSafeData('invoices');
            invoiceTableBody.innerHTML = '';

            currentInvoices.forEach((inv, index) => {
                // Filter by Status
                if (filter !== 'all' && inv.status !== filter) return;

                // Filter by Search
                if (searchQuery) {
                    const query = searchQuery.toLowerCase();
                    const match = inv.client.toLowerCase().includes(query) ||
                        inv.id.toLowerCase().includes(query) ||
                        (inv.note || '').toLowerCase().includes(query);
                    if (!match) return;
                }

                let statusBadge = '';
                if (inv.status === 'active' || inv.status === 'paid') statusBadge = '<span class="status-badge status-active">Paid</span>';
                else if (inv.status === 'pending') statusBadge = '<span class="status-badge status-pending">Pending</span>';
                else statusBadge = '<span class="status-badge status-inactive">Overdue</span>';

                const row = document.createElement('tr');
                row.className = 'invoice-row';
                row.innerHTML = `
                    <td>
                        <div style="display: flex; align-items: center; gap: 0.75rem;">
                            <div style="width: 32px; height: 32px; background: var(--bg-body); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: var(--primary-color);">
                                <i class="fa-solid fa-file-invoice"></i>
                            </div>
                            <div style="display: flex; flex-direction: column;">
                                <strong style="font-size: 0.95rem;">${escapeHTML(inv.id)}</strong>
                                <span style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase;">${inv.status}</span>
                            </div>
                        </div>
                    </td>
                    <td><span style="font-weight: 500;">${escapeHTML(inv.client)}</span></td>
                    <td><span class="text-muted">${formatDate(inv.date)}</span></td>
                    <td><span class="text-muted">${formatDate(inv.due)}</span></td>
                    <td><strong style="color: var(--primary-color); font-size: 1.1rem;">$${(parseFloat(inv.amount) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong></td>
                    <td style="max-width: 150px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--text-muted); font-size: 0.85rem;" title="${escapeHTML(inv.note || '')}">
                        ${escapeHTML(inv.note) || '-'}
                    </td>
                    <td>${statusBadge}</td>
                    <td>
                        <button class="action-btn invoice-action-btn" data-index="${index}"><i class="fa-solid fa-ellipsis-vertical"></i></button>
                    </td>
                `;
                invoiceTableBody.appendChild(row);
            });
            // Update the global invoices reference for other functions
            invoices = currentInvoices;
        }

        // Helper: Format Date
        function formatDate(dateString) {
            if (!dateString) return '-';
            const options = { year: 'numeric', month: 'short', day: 'numeric' };
            const d = new Date(dateString);
            return isNaN(d.getTime()) ? dateString : d.toLocaleDateString('en-US', options);
        }

        // Initial Render
        renderInvoices();

        // Search Logic
        if (invoiceSearchInput) {
            invoiceSearchInput.addEventListener('input', (e) => {
                const query = e.target.value;
                const activeFilter = document.querySelector('.invoice-filters .filter-btn.active');
                renderInvoices(activeFilter ? activeFilter.getAttribute('data-filter') : 'all', query);
            });
        }

        // Filter Logic
        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // Remove active class
                filterBtns.forEach(b => {
                    b.classList.remove('active');
                    b.style.borderBottom = 'none';
                    b.style.color = 'var(--text-muted)';
                });
                // Add active class
                btn.classList.add('active');
                btn.style.borderBottom = '2px solid var(--primary-color)';
                btn.style.color = 'var(--primary-color)';

                const searchQuery = invoiceSearchInput ? invoiceSearchInput.value : '';
                renderInvoices(btn.getAttribute('data-filter'), searchQuery);
            });
        });

        // Add Invoice Logic
        if (invoiceBtn && invoiceModal) {
            invoiceBtn.addEventListener('click', () => {
                if (invoiceForm) invoiceForm.reset();
                invoiceModal.style.display = 'flex';
                setTimeout(() => invoiceModal.classList.add('show'), 10);
            });

            // Close Modal Logic (Generic for both modals)
            const closeModals = () => {
                document.querySelectorAll('.modal').forEach(m => {
                    m.classList.remove('show');
                    setTimeout(() => m.style.display = 'none', 300);
                });
            };

            document.querySelectorAll('.close-modal, .close-modal-btn').forEach(el => {
                el.addEventListener('click', closeModals);
            });

            window.addEventListener('click', (e) => {
                if (e.target.classList.contains('modal')) closeModals();
            });

            // Form Submit
            if (invoiceForm) {
                invoiceForm.addEventListener('submit', (e) => {
                    e.preventDefault();

                    const client = document.getElementById('invoiceClientSelect').value;
                    const date = document.getElementById('invoiceDate').value;
                    const due = document.getElementById('invoiceDueDate').value;
                    const amount = parseFloat(document.getElementById('invoiceAmount').value);
                    const status = document.getElementById('invoiceStatus').value;
                    const note = document.getElementById('invoiceNote').value;

                    if (invoiceActionDropdown.editingIndex !== undefined && invoiceActionDropdown.editingIndex !== null) {
                        // Update Existing
                        const index = invoiceActionDropdown.editingIndex;
                        invoices[index] = {
                            ...invoices[index],
                            client,
                            date,
                            due,
                            amount,
                            status,
                            note
                        };
                        invoiceActionDropdown.editingIndex = null;
                        alert('Invoice updated successfully!');
                    } else {
                        // Create New
                        const newId = '#INV-' + (1026 + invoices.length);
                        invoices.unshift({
                            id: newId,
                            client,
                            date,
                            due,
                            amount,
                            status,
                            note
                        });
                        alert('Invoice created successfully!');
                    }

                    // Save to Storage
                    localStorage.setItem('invoices', JSON.stringify(invoices));

                    // Re-render
                    const activeFilter = document.querySelector('.invoice-filters .filter-btn.active');
                    const searchQuery = invoiceSearchInput ? invoiceSearchInput.value : '';
                    renderInvoices(activeFilter ? activeFilter.getAttribute('data-filter') : 'all', searchQuery);

                    closeModals();
                    updateDashboard(); // Update KPIs
                });
            }
        }

        // Invoice Action Dropdown Logic
        if (invoiceActionDropdown) {
            document.addEventListener('click', (e) => {
                const btn = e.target.closest('.invoice-action-btn');

                if (btn && invoiceActionDropdown) {
                    e.stopPropagation();
                    const index = btn.getAttribute('data-index');

                    // Close if same
                    if (invoiceActionDropdown.style.display === 'block' && invoiceActionDropdown.activeIndex === index) {
                        hideInvoiceDropdown();
                        return;
                    }

                    invoiceActionDropdown.activeIndex = index;
                    invoiceActionDropdown.activeBtn = btn;

                    const rect = btn.getBoundingClientRect();
                    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

                    invoiceActionDropdown.style.top = (rect.bottom + scrollTop + 5) + 'px';
                    invoiceActionDropdown.style.left = (rect.left - 130) + 'px';
                    invoiceActionDropdown.style.display = 'block';

                    // Active state
                    document.querySelectorAll('.invoice-action-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');

                } else if (invoiceActionDropdown && !e.target.closest('.action-dropdown')) {
                    hideInvoiceDropdown();
                }
            });

            function hideInvoiceDropdown() {
                invoiceActionDropdown.style.display = 'none';
                if (invoiceActionDropdown.activeBtn) invoiceActionDropdown.activeBtn.classList.remove('active');
                invoiceActionDropdown.activeBtn = null;
                invoiceActionDropdown.activeIndex = null;
            }
            window.addEventListener('scroll', hideInvoiceDropdown, true);

            // Logic for Dropdown Actions

            // View Details
            const viewLink = invoiceActionDropdown.querySelector('.view-invoice-link');
            if (viewLink) {
                viewLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (invoiceActionDropdown.activeIndex !== null) {
                        const inv = invoices[invoiceActionDropdown.activeIndex];
                        if (inv) {
                            // Populate Modal
                            // Populate Professional Document
                            document.getElementById('viewInvId').textContent = inv.id;
                            document.getElementById('viewInvClient').textContent = inv.client;
                            document.getElementById('viewInvDate').textContent = formatDate(inv.date);
                            document.getElementById('viewInvDue').textContent = formatDate(inv.due);

                            const statusBadge = document.getElementById('viewInvStatusBadge');
                            if (statusBadge) {
                                statusBadge.textContent = inv.status.toUpperCase();
                                statusBadge.className = `status-badge status-${inv.status}`;
                            }

                            const amountVal = `$${parseFloat(inv.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
                            const bodyAmount = document.getElementById('viewInvAmountBody');
                            const totalAmount = document.getElementById('viewInvAmountTotal');
                            if (bodyAmount) bodyAmount.textContent = amountVal;
                            if (totalAmount) totalAmount.textContent = amountVal;

                            const noteDisplay = document.getElementById('viewInvNoteDisplay');
                            if (noteDisplay) {
                                noteDisplay.textContent = inv.note ? `Note: ${inv.note}` : 'No additional notes.';
                            }

                            // Show
                            viewInvoiceModal.style.display = 'flex';
                            setTimeout(() => viewInvoiceModal.classList.add('show'), 10);
                            hideInvoiceDropdown();
                        }
                    }
                });
            }

            // Edit Invoice
            const editInvLink = invoiceActionDropdown.querySelector('.edit-invoice-link');
            if (editInvLink) {
                editInvLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    const index = invoiceActionDropdown.activeIndex;
                    if (index !== null) {
                        const inv = invoices[index];
                        if (inv) {
                            // Populate Form
                            document.getElementById('invoiceClientSelect').value = inv.client;
                            document.getElementById('invoiceDate').value = inv.date;
                            document.getElementById('invoiceDueDate').value = inv.due;
                            document.getElementById('invoiceAmount').value = inv.amount;
                            document.getElementById('invoiceStatus').value = inv.status;
                            if (document.getElementById('invoiceNote')) {
                                document.getElementById('invoiceNote').value = inv.note || '';
                            }

                            // Update Modal UI
                            document.querySelector('#addInvoiceModal h2').textContent = 'Edit Invoice';
                            document.querySelector('#addInvoiceModal .btn-primary').textContent = 'Update Invoice';

                            invoiceActionDropdown.editingIndex = index;

                            // Show Modal
                            invoiceModal.style.display = 'flex';
                            setTimeout(() => invoiceModal.classList.add('show'), 10);
                            hideInvoiceDropdown();
                        }
                    }
                });
            }

            // Download PDF (Implementing as Text/CSV for now as per web environment capabilities)
            const downloadLink = invoiceActionDropdown.querySelector('.download-invoice-link');
            const modalDownloadBtn = document.getElementById('modalDownloadBtn');

            const handleDownload = (e) => {
                e.preventDefault();
                const index = invoiceActionDropdown.activeIndex;
                let inv = null;

                // If index is available from dropdown
                if (index !== null && index !== undefined && index !== '') {
                    inv = invoices[index];
                } else {
                    // Try to find what's being viewed in the modal
                    const idText = document.getElementById('viewInvId').textContent.trim();
                    inv = invoices.find(i => i.id.trim() === idText);
                }

                if (!inv) {
                    alert("Could not find invoice data to download.");
                    return;
                }

                // Generate modern HTML invoice content
                const amountFormatted = `$${parseFloat(inv.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
                const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Invoice ${inv.id}</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
        :root { --primary: #1E3A8A; --text: #1a1a1a; --muted: #64748b; }
        body { font-family: 'Inter', sans-serif; padding: 40px; color: var(--text); line-height: 1.6; background: #f8fafc; }
        .doc { background: #fff; max-width: 800px; margin: 0 auto; padding: 60px; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
        .header { display: flex; justify-content: space-between; border-bottom: 2px solid #f1f5f9; padding-bottom: 30px; margin-bottom: 40px; }
        .logo { font-size: 24px; font-weight: 800; color: var(--primary); }
        h1 { font-size: 48px; margin: 0; letter-spacing: -2px; color: var(--primary); opacity: 0.9; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
        .grid h4 { text-transform: uppercase; font-size: 12px; color: var(--muted); margin-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
        th { text-align: left; background: #f8fafc; padding: 15px; font-size: 12px; color: var(--muted); text-transform: uppercase; }
        td { padding: 20px 15px; border-bottom: 1px solid #f1f5f9; }
        .total-box { background: var(--primary); color: #fff; padding: 25px 40px; border-radius: 8px; display: inline-block; text-align: right; }
        .total-box span { display: block; font-size: 12px; opacity: 0.8; }
        .total-box strong { font-size: 32px; }
        .footer { text-align: center; border-top: 1px solid #f1f5f9; padding-top: 30px; font-size: 14px; color: var(--muted); }
    </style>
</head>
<body>
    <div class="doc">
        <div class="header">
            <div><div class="logo">FreelanceFlow</div><p style="font-size: 14px; color: var(--muted);">Professional Services</p></div>
            <div style="text-align: right;"><h1>INVOICE</h1><p style="font-weight: 700;">${inv.id}</p></div>
        </div>
        <div class="grid">
            <div><h4>Attention</h4><p style="font-size: 18px; font-weight: 700;">${inv.client}</p><p style="color: var(--muted);">Valued Customer</p></div>
            <div>
                <h4>Details</h4>
                <p><strong>Date:</strong> ${formatDate(inv.date)}</p>
                <p><strong>Due Date:</strong> ${formatDate(inv.due)}</p>
                <p><strong>Status:</strong> ${inv.status.toUpperCase()}</p>
            </div>
        </div>
        <table>
            <thead><tr><th>Description</th><th style="text-align: right;">Amount</th></tr></thead>
            <tbody>
                <tr>
                    <td><strong>Freelance Project Services</strong><p style="font-size: 12px; color: var(--muted);">${inv.note || 'No additional notes provided.'}</p></td>
                    <td style="text-align: right; font-weight: 700; font-size: 18px;">${amountFormatted}</td>
                </tr>
            </tbody>
        </table>
        <div style="text-align: right; margin-bottom: 40px;">
            <div class="total-box"><span>Amount Due</span><strong>${amountFormatted}</strong></div>
        </div>
        <div class="footer"><p>Thank you for choosing FreelanceFlow for your project needs.</p></div>
    </div>
    <script>window.print();</script>
</body>
</html>`;

                const blob = new Blob([htmlContent], { type: 'text/html' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Invoice_${inv.id.replace('#', '')}.html`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);

                alert("Professional HTML Invoice generated. Opening print dialog...");
                hideInvoiceDropdown();
            };

            if (downloadLink) downloadLink.addEventListener('click', handleDownload);
            if (modalDownloadBtn) modalDownloadBtn.addEventListener('click', handleDownload);

            // Delete Action
            const deleteLink = invoiceActionDropdown.querySelector('.remove-invoice-link');
            if (deleteLink) {
                deleteLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    const index = invoiceActionDropdown.activeIndex;
                    if (index !== null) {
                        const inv = invoices[index];
                        if (confirm('Delete invoice ' + inv.id + '?')) {
                            invoices.splice(index, 1);
                            localStorage.setItem('invoices', JSON.stringify(invoices));

                            const activeFilter = document.querySelector('.invoice-filters .filter-btn.active');
                            const searchQuery = invoiceSearchInput ? invoiceSearchInput.value : '';
                            renderInvoices(activeFilter ? activeFilter.getAttribute('data-filter') : 'all', searchQuery);
                            hideInvoiceDropdown();
                            updateDashboard();
                            alert('Invoice deleted!');
                        }
                    }
                });
            }
        }
    }

    // --- Settings Page Logic ---
    const saveSettingsBtn = document.getElementById('saveSettingsBtn');
    const cancelSettingsBtn = document.getElementById('cancelSettingsBtn');
    const profileUpload = document.getElementById('profileUpload');
    const changePhotoBtn = document.getElementById('changePhotoBtn');
    const settingsProfileImg = document.getElementById('settingsProfileImg');

    if (saveSettingsBtn) {
        // Load Settings on Init
        const savedSettings = JSON.parse(localStorage.getItem('userSettings') || '{}');
        const savedAvatar = localStorage.getItem('userAvatar');

        if (savedAvatar && settingsProfileImg) settingsProfileImg.src = savedAvatar;

        // Update global avatar if exists (e.g. sidebar)
        if (savedAvatar) {
            document.querySelectorAll('.user-profile img, .sidebar-header img, .avatar').forEach(img => {
                if (img !== settingsProfileImg) img.src = savedAvatar;
            });
        }

        if (savedSettings.firstName) document.getElementById('settingsFirstName').value = savedSettings.firstName;
        if (savedSettings.lastName) document.getElementById('settingsLastName').value = savedSettings.lastName;
        if (savedSettings.email) document.getElementById('settingsEmail').value = savedSettings.email;
        if (savedSettings.bio) document.getElementById('settingsBio').value = savedSettings.bio;

        // Handle Photo Upload
        if (changePhotoBtn && profileUpload) {
            changePhotoBtn.addEventListener('click', () => profileUpload.click());

            profileUpload.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = function (e) {
                        const result = e.target.result;
                        if (settingsProfileImg) settingsProfileImg.src = result;
                        localStorage.setItem('userAvatar', result);

                        // Update other images instantly
                        document.querySelectorAll('.user-profile img, .sidebar-header img, .avatar').forEach(img => {
                            if (img !== settingsProfileImg) img.src = result;
                        });
                    };
                    reader.readAsDataURL(file);
                }
            });
        }

        // Save Changes
        saveSettingsBtn.addEventListener('click', () => {
            const settings = {
                firstName: document.getElementById('settingsFirstName').value,
                lastName: document.getElementById('settingsLastName').value,
                email: document.getElementById('settingsEmail').value,
                bio: document.getElementById('settingsBio').value,
                currency: document.getElementById('settingsCurrency').value,
                language: document.getElementById('settingsLanguage').value,
                emailNotify: document.getElementById('settingsEmailNotify').checked,
                desktopNotify: document.getElementById('settingsDesktopNotify').checked
            };

            localStorage.setItem('userSettings', JSON.stringify(settings));
            alert('Settings Saved Successfully!');

            // Update displayed name if possible
            const userNameDisplay = document.querySelector('.user-name');
            if (userNameDisplay) userNameDisplay.textContent = settings.firstName + ' ' + settings.lastName;
        });

        // Cancel Changes
        if (cancelSettingsBtn) {
            cancelSettingsBtn.addEventListener('click', () => {
                if (confirm('Discard unsaved changes?')) {
                    // Reload saved values
                    const savedSettings = JSON.parse(localStorage.getItem('userSettings') || '{}');

                    document.getElementById('settingsFirstName').value = savedSettings.firstName || 'Alex';
                    document.getElementById('settingsLastName').value = savedSettings.lastName || 'Doe';
                    document.getElementById('settingsEmail').value = savedSettings.email || 'alex.doe@example.com';
                    document.getElementById('settingsBio').value = savedSettings.bio || 'Full-stack freelance developer.';
                    if (savedSettings.currency) document.getElementById('settingsCurrency').value = savedSettings.currency;
                    if (savedSettings.language) document.getElementById('settingsLanguage').value = savedSettings.language;

                    document.getElementById('settingsEmailNotify').checked = savedSettings.emailNotify !== false;
                    document.getElementById('settingsDesktopNotify').checked = savedSettings.desktopNotify !== false;
                }
            });
        }
    }

    // Apply Global Avatar on other pages (Run this outside the if(saveSettingsBtn) block)
    const storedAvatar = localStorage.getItem('userAvatar');
    if (storedAvatar) {
        document.querySelectorAll('.user-profile img, .sidebar-header img, .avatar').forEach(img => {
            // Avoid overwriting specific settings img logic if purely global run
            if (img.id !== 'settingsProfileImg') img.src = storedAvatar;
        });
    }
    const storedSettings = JSON.parse(localStorage.getItem('userSettings') || '{}');
    if (storedSettings.firstName) {
        const userNameDisplay = document.querySelector('.user-name');
        if (userNameDisplay) userNameDisplay.textContent = storedSettings.firstName + ' ' + storedSettings.lastName;
    }
    // --- Notification Logic ---
    const notificationBtn = document.getElementById('notificationBtn');
    const notificationDropdown = document.getElementById('notificationDropdown');

    if (notificationBtn && notificationDropdown) {
        notificationBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isActive = notificationDropdown.classList.contains('show');

            // Close others
            document.querySelectorAll('.dropdown, .action-dropdown').forEach(d => d.style.display = 'none');

            if (isActive) {
                notificationDropdown.classList.remove('show');
                notificationDropdown.style.display = 'none';
            } else {
                notificationDropdown.classList.add('show');
                notificationDropdown.style.display = 'block';

                // Position logic (simple right alignment)
                const rect = notificationBtn.getBoundingClientRect();
                notificationDropdown.style.top = (rect.bottom + 10) + 'px';
                notificationDropdown.style.right = (window.innerWidth - rect.right) + 'px';
                notificationDropdown.style.left = 'auto';
            }
        });

        window.addEventListener('click', (e) => {
            if (!e.target.closest('#notificationDropdown') && !e.target.closest('#notificationBtn')) {
                notificationDropdown.classList.remove('show');
                notificationDropdown.style.display = 'none';
            }
        });
    }

    // --- Search Logic ---

    // 1. Global Search (Dashboard)
    const globalSearchInput = document.getElementById('globalSearchInput');
    if (globalSearchInput) {
        globalSearchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();

            // Filter Projects List (Dashboard)
            const projectItems = document.querySelectorAll('.project-item');
            if (projectItems.length > 0) {
                projectItems.forEach(item => {
                    const text = item.textContent.toLowerCase();
                    item.style.display = text.includes(query) ? 'flex' : 'none';
                });
            }

            // Filter Clients Table (Dashboard)
            const tableRows = document.querySelectorAll('.data-table tbody tr');
            if (tableRows.length > 0) {
                tableRows.forEach(row => {
                    const text = row.textContent.toLowerCase();
                    row.style.display = text.includes(query) ? 'table-row' : 'none';
                });
            }
        });
    }



    // 3. Project Search (Projects Page)
    const projectSearchInput = document.getElementById('projectSearchInput');
    if (projectSearchInput) {
        projectSearchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            const cards = document.querySelectorAll('.grid-template .card');

            cards.forEach(card => {
                // Skip if it's the KPI cards on dashboard (they don't have .card-title usually relevant for search or project structure)
                // Actually, project page cards have .card-title. Dashboard KPI cards have .kpi-value.
                if (card.querySelector('.card-title')) {
                    const text = card.textContent.toLowerCase();
                    // Use 'block' or default display. 
                    // Grid items don't strictly need 'block', just non-none.
                    card.style.display = text.includes(query) ? 'block' : 'none';
                }
            });
        });
    }

    // 4. Time Tracking Search (Table)
    const timeTrackingSearchInput = document.getElementById('timeTrackingSearchInput');
    if (timeTrackingSearchInput) {
        timeTrackingSearchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            document.querySelectorAll('.data-table tbody tr').forEach(row => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(query) ? 'table-row' : 'none';
            });
        });
    }

    // 5. Analytics Search (KPI Cards)
    const analyticsSearchInput = document.getElementById('analyticsSearchInput');
    if (analyticsSearchInput) {
        analyticsSearchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            // Filter KPI Cards
            document.querySelectorAll('.kpi-card').forEach(card => {
                const text = card.textContent.toLowerCase();
                card.style.display = text.includes(query) ? 'block' : 'none';
            });
            // Optional: Filter charts based on title if we wanted, but cards is enough for "search data"
        });
    }
    // --- Dashboard & Global Data Logic ---
    function updateDashboard() {
        // Run only on Dashboard
        const activeClientsCount = document.getElementById('activeClientsCount');
        const recentClientsTableBody = document.getElementById('recentClientsTableBody');
        const pendingProjectsCount = document.getElementById('pendingProjectsCount');
        const activeProjectsList = document.getElementById('activeProjectsList');
        const monthlyIncomeCount = document.getElementById('monthlyIncomeCount');
        const hoursTrackedCount = document.getElementById('hoursTrackedCount');

        // Check if we are on dashboard (at least one element exists)
        if (!activeClientsCount && !recentClientsTableBody && !pendingProjectsCount && !activeProjectsList && !monthlyIncomeCount && !hoursTrackedCount) return;

        const currentClients = getSafeData('clients');
        const currentProjects = getSafeData('projects');
        const currentInvoices = getSafeData('invoices');
        const currentTimeEntries = getSafeData('timeEntries');

        // 1. Update Active Clients KPI
        if (activeClientsCount) {
            const activeCount = currentClients.filter(c => c && c.status === 'active').length;
            activeClientsCount.textContent = activeCount;
        }

        // 2. Update Pending Projects KPI
        if (pendingProjectsCount) {
            const pendingCount = currentProjects.filter(p => p && p.status === 'pending').length;
            pendingProjectsCount.textContent = pendingCount;
        }

        // 3. Update Monthly Income KPI
        if (monthlyIncomeCount) {
            const paidInvoices = currentInvoices.filter(inv => inv.status === 'paid');
            const totalIncome = paidInvoices.reduce((sum, inv) => {
                const amt = parseFloat(inv.amount);
                return sum + (isNaN(amt) ? 0 : amt);
            }, 0);
            monthlyIncomeCount.textContent = '$' + totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2 });
        }

        // 4. Update Hours Tracked KPI
        if (hoursTrackedCount) {
            const totalSeconds = currentTimeEntries.reduce((sum, entry) => sum + (entry.durationSeconds || 0), 0);
            const totalHours = (totalSeconds / 3600).toFixed(1);
            hoursTrackedCount.textContent = totalHours + 'h';
        }

        // 5. Update Active Projects List
        if (activeProjectsList) {
            activeProjectsList.innerHTML = '';
            // Get active projects
            const activeProjects = currentProjects.filter(p => p.status === 'active');

            if (activeProjects.length === 0) {
                activeProjectsList.innerHTML = `
                    <div style="text-align: center; padding: 2rem; color: var(--text-muted);">
                        <p>No active projects.</p>
                    </div>`;
            } else {
                // Show up to 3 active projects
                activeProjects.slice(0, 3).forEach(proj => {
                    const item = document.createElement('div');
                    item.className = 'project-item';
                    item.innerHTML = `
                        <div class="project-info">
                            <span>${proj.name}</span>
                            <span>${proj.progress}%</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${proj.progress}%; background-color: var(--primary-color);"></div>
                        </div>
                        <div style="margin-top:0.25rem; display:flex; justify-content:space-between; align-items:center;">
                            <span style="font-size:0.75rem; color:var(--text-muted);">${proj.client}</span>
                            ${proj.note ? `<span style="font-size:0.75rem; color:var(--text-muted); max-width:150px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${proj.note}">${proj.note}</span>` : ''}
                        </div>
                    `;
                    activeProjectsList.appendChild(item);
                });
            }
        }

        // 4. Update Recent Clients Table (with Note)
        if (recentClientsTableBody) {
            recentClientsTableBody.innerHTML = '';

            if (currentClients.length === 0) {
                recentClientsTableBody.innerHTML = `
                    <tr>
                        <td colspan="5" style="text-align: center; padding: 2rem; color: var(--text-muted);">
                            No recent clients found.
                        </td>
                    </tr>`;
            } else {
                currentClients.slice(0, 5).forEach(client => {
                    if (!client || !client.name) return;
                    let statusBadge = '';
                    if (client.status === 'active') statusBadge = '<span class="status-badge status-active">Active</span>';
                    else if (client.status === 'onboarding') statusBadge = '<span class="status-badge status-pending">Onboarding</span>';
                    else statusBadge = '<span class="status-badge status-inactive">Inactive</span>';

                    // Calculate Earnings
                    const name = client.name || 'Unknown';
                    const clientPaid = currentInvoices.filter(inv => inv.client === name && inv.status === 'paid');
                    const totalEarnings = clientPaid.reduce((sum, inv) => {
                        const amt = parseFloat(inv.amount);
                        return sum + (isNaN(amt) ? 0 : amt);
                    }, 0);

                    const safeName = name.replace(' ', '+');
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td style="display:flex; align-items:center; gap:0.75rem;">
                            <img src="https://ui-avatars.com/api/?name=${safeName}&background=random" 
                                 style="width:32px; height:32px; border-radius:50%;" alt="">
                            <div>${escapeHTML(name)}</div>
                        </td>
                        <td style="max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--text-muted);" title="${escapeHTML(client.note || '')}">
                            ${escapeHTML(client.note) || '-'}
                        </td>
                        <td>${statusBadge}</td>
                        <td>$${totalEarnings.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td><button class="action-btn"><i class="fa-solid fa-ellipsis-vertical"></i></button></td>
                    `;
                    recentClientsTableBody.appendChild(row);
                });
            }
        }
    }

    function populateClientDropdowns() {
        const clients = getSafeData('clients');
        const dropdowns = ['projectClientSelect', 'invoiceClientSelect'];

        dropdowns.forEach(id => {
            const select = document.getElementById(id);
            if (select) {
                // Keep the first option (disabled select)
                const firstOption = select.options[0];
                select.innerHTML = '';
                select.appendChild(firstOption);

                clients.forEach(client => {
                    if (client && client.name) {
                        const option = document.createElement('option');
                        option.value = client.name;
                        option.textContent = client.name;
                        select.appendChild(option);
                    }
                });
            }
        });
    }

    // --- Time Tracking Logic ---
    const timerDisplay = document.getElementById('timer-display');
    const startBtn = document.getElementById('timer-start-btn');
    const timeTrackingTableBody = document.getElementById('timeTrackingTableBody');
    let timerInterval = null;
    let seconds = 0;
    let isRunning = false;

    function renderTimeEntries() {
        if (!timeTrackingTableBody) return;
        timeTrackingTableBody.innerHTML = '';

        if (timeEntries.length === 0) {
            timeTrackingTableBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-muted);">
                        No time entries recorded.
                    </td>
                </tr>`;
            return;
        }

        timeEntries.forEach((entry, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${escapeHTML(entry.project) || 'General'}</td>
                <td>${escapeHTML(entry.description) || '-'}</td>
                <td>${new Date(entry.date).toLocaleDateString()}</td>
                <td>${escapeHTML(entry.duration)}</td>
                <td><span class="status-badge status-active">Yes</span></td>
                <td><button class="action-btn delete-time-btn" data-index="${index}"><i class="fa-solid fa-trash"></i></button></td>
            `;
            timeTrackingTableBody.appendChild(row);
        });

        // Add delete logic
        document.querySelectorAll('.delete-time-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = btn.getAttribute('data-index');
                timeEntries.splice(index, 1);
                localStorage.setItem('timeEntries', JSON.stringify(timeEntries));
                renderTimeEntries();
                updateDashboard();
            });
        });
    }

    if (timeTrackingTableBody) renderTimeEntries();

    if (startBtn && timerDisplay) {
        startBtn.addEventListener('click', () => {
            if (isRunning) {
                // Stop
                clearInterval(timerInterval);
                startBtn.innerHTML = '<i class="fa-solid fa-play"></i> Start';
                startBtn.style.backgroundColor = 'var(--primary-color)';
                isRunning = false;

                // Save Entry
                const description = document.querySelector('input[placeholder="What are you working on?"]').value;
                const hrs = Math.floor(seconds / 3600);
                const mins = Math.floor((seconds % 3600) / 60);
                const secs = seconds % 60;
                const duration = `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')} `;

                if (seconds > 0) {
                    const newEntry = {
                        project: 'General',
                        description: description || 'Unnamed Task',
                        date: new Date().toISOString(),
                        duration: duration,
                        durationSeconds: seconds
                    };
                    timeEntries.unshift(newEntry);
                    localStorage.setItem('timeEntries', JSON.stringify(timeEntries));
                    renderTimeEntries();
                    updateDashboard();
                    alert('Time entry saved!');
                }

                seconds = 0;
                timerDisplay.textContent = '00:00:00';
                if (document.querySelector('input[placeholder="What are you working on?"]')) {
                    document.querySelector('input[placeholder="What are you working on?"]').value = '';
                }
            } else {
                // Start
                startBtn.innerHTML = '<i class="fa-solid fa-pause"></i> Pause';
                startBtn.style.backgroundColor = '#ECC94B';
                isRunning = true;

                timerInterval = setInterval(() => {
                    seconds++;
                    const hrs = Math.floor(seconds / 3600);
                    const mins = Math.floor((seconds % 3600) / 60);
                    const secs = seconds % 60;
                    timerDisplay.textContent =
                        `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')} `;
                }, 1000);
            }
        });
    }

    // --- Charts Initialization for Time Tracking ---
    if (typeof Chart !== 'undefined') {
        if (document.getElementById('weeklyChart')) {
            const ctxWeekly = document.getElementById('weeklyChart').getContext('2d');
            new Chart(ctxWeekly, {
                type: 'bar',
                data: {
                    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                    datasets: [{
                        label: 'Hours',
                        data: [0, 0, 0, 0, 0, 0, 0],
                        backgroundColor: '#1E3A8A',
                        borderRadius: 4
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false }
            });
        }

        if (document.getElementById('billableChart')) {
            const ctxBillable = document.getElementById('billableChart').getContext('2d');
            new Chart(ctxBillable, {
                type: 'doughnut',
                data: {
                    labels: ['Billable', 'Non-Billable'],
                    datasets: [{
                        data: [timeEntries.length, 0],
                        backgroundColor: ['#1E3A8A', '#3B82F6'],
                        borderWidth: 0
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false, cutout: '70%' }
            });
        }
    }

    // Initialize Global Logic
    updateDashboard();
    populateClientDropdowns();

    // --- Deep Linking: Create Invoice from Client Page ---
    const urlParams = new URLSearchParams(window.location.search);
    const clientToInvoice = urlParams.get('client');

    if (clientToInvoice && typeof invoiceModal !== 'undefined' && typeof invoiceBtn !== 'undefined' && invoiceModal && invoiceBtn) {
        // Wait a tiny bit to ensure dropdowns are populated
        setTimeout(() => {
            // Check if client exists
            populateClientDropdowns(); // Ensure it's populated

            // Open Modal
            invoiceModal.style.display = 'flex';
            setTimeout(() => invoiceModal.classList.add('show'), 10);

            // Pre-select client
            const clientSelect = document.getElementById('invoiceClientSelect');
            if (clientSelect) {
                const options = Array.from(clientSelect.options);
                const exists = options.some(opt => opt.value === clientToInvoice);

                if (exists) {
                    clientSelect.value = clientToInvoice;
                } else {
                    // Temporarily add the client so it's selected
                    const newOpt = document.createElement('option');
                    newOpt.value = clientToInvoice;
                    newOpt.textContent = clientToInvoice;
                    clientSelect.appendChild(newOpt);
                    clientSelect.value = clientToInvoice;
                }
            }
        }, 150);
    }

});
