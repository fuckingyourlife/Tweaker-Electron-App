document.addEventListener('DOMContentLoaded', () => {
    const loginScreen = document.getElementById('login-screen');
    const mainApp = document.getElementById('main-app');
    const discordLoginBtn = document.getElementById('discord-login-btn');
    const navItems = document.querySelectorAll('.nav-item');
    const tabPanes = document.querySelectorAll('.tab-pane');
    const logoutBtn = document.getElementById('logout-btn');

    // Tab Navigation
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const target = item.getAttribute('data-tab');

            navItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');

            tabPanes.forEach(pane => {
                pane.classList.remove('active');
                if (pane.id === target) {
                    pane.classList.add('active');
                }
            });
        });
    });

    // Discord Login Interaction
    discordLoginBtn.addEventListener('click', async () => {
        const originalText = discordLoginBtn.innerHTML;
        discordLoginBtn.innerHTML = '<span>⏳</span> Connecting...';
        discordLoginBtn.disabled = true;

        try {
            const result = await window.electron.ipcRenderer.invoke('discord-login');

            if (result.success) {
                // Transition to main app
                loginScreen.style.opacity = '0';
                setTimeout(() => {
                    loginScreen.style.display = 'none';
                    mainApp.style.display = 'flex';
                    mainApp.style.opacity = '0';
                    setTimeout(() => mainApp.style.opacity = '1', 50);
                }, 300);

                // Update User info (Discord-like)
                document.getElementById('user-name').textContent = result.user.username;
                document.getElementById('user-avatar').src = `https://cdn.discordapp.com/avatars/${result.user.id}/${result.user.avatar}.png`;

                const roleEl = document.getElementById('user-role');
                const adminTab = document.querySelector('.admin-tab');
                const premiumLock = document.getElementById('premium-lock');
                const premiumContent = document.getElementById('premium-content');

                if (result.roles.isAdmin) {
                    roleEl.textContent = 'Administrator';
                    roleEl.style.color = '#ff4d4d';
                    adminTab.style.display = 'flex';
                } else if (result.roles.isPremium) {
                    roleEl.textContent = 'Premium User';
                    roleEl.style.color = 'var(--color-accent)';
                    premiumLock.style.display = 'none';
                    premiumContent.style.display = 'flex';
                } else {
                    roleEl.textContent = 'Free Access';
                }
            } else {
                alert('Login Error: ' + (result.error || 'Unknown error'));
                discordLoginBtn.innerHTML = originalText;
                discordLoginBtn.disabled = false;
            }
        } catch (err) {
            console.error(err);
            alert('Authentication failed: ' + err.message);
            discordLoginBtn.innerHTML = originalText;
            discordLoginBtn.disabled = false;
        }
    });

    // Logout Logic
    logoutBtn.addEventListener('click', () => {
        mainApp.style.opacity = '0';
        setTimeout(() => {
            mainApp.style.display = 'none';
            loginScreen.style.display = 'flex';
            loginScreen.style.opacity = '1';
            discordLoginBtn.disabled = false;
            discordLoginBtn.innerHTML = '<i class="fa-brands fa-discord"></i> Login with Discord';
        }, 300);
    });

    // GPU Switcher Logic
    const gpuBtns = document.querySelectorAll('.btn-gpu');
    const gpuContents = document.querySelectorAll('.gpu-content');

    gpuBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.getAttribute('data-gpu');

            gpuBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            gpuContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === `gpu-${target}`) {
                    content.classList.add('active');
                }
            });
        });
    });

    // Tweak Action Logic (Enhanced)
    document.querySelectorAll('.btn-action').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const originalText = btn.textContent;
            const card = btn.closest('.tweak-card');
            const tweakName = card.querySelector('h4').textContent.trim();

            btn.textContent = 'Applying...';
            btn.disabled = true;
            card.style.opacity = '0.7';

            try {
                const result = await window.electron.ipcRenderer.invoke('apply-tweak', {
                    tweakName: tweakName,
                    isActive: true
                });

                if (result.success) {
                    btn.textContent = 'Active';
                    btn.style.background = 'var(--color-accent)';
                    btn.style.borderColor = 'var(--color-accent)';
                    card.style.opacity = '1';
                    console.log(`Command executed for: ${tweakName}`);
                } else {
                    throw new Error(result.error);
                }
            } catch (err) {
                console.error(err);
                btn.textContent = 'Failed';
                btn.style.background = '#ff4d4d';
                card.style.opacity = '1';
                setTimeout(() => {
                    btn.textContent = originalText;
                    btn.style.background = '';
                    btn.disabled = false;
                }, 2000);
            }
        });
    });

    // Handle switches
    document.querySelectorAll('.switch input').forEach(input => {
        input.addEventListener('change', async (e) => {
            const card = input.closest('.tweak-card');
            const tweakName = card.querySelector('h4').textContent.trim();
            const isEnabled = input.checked;

            try {
                const result = await window.electron.ipcRenderer.invoke('apply-tweak', {
                    tweakName: tweakName,
                    isActive: isEnabled
                });

                if (result.success) {
                    if (isEnabled) {
                        console.log(`Enabled: ${tweakName}`);
                        card.style.borderColor = 'var(--color-accent)';
                    } else {
                        console.log(`Disabled: ${tweakName}`);
                        card.style.borderColor = 'var(--glass-border)';
                    }
                } else {
                    throw new Error(result.error);
                }
            } catch (err) {
                console.error(err);
                // Revert switch visually
                input.checked = !isEnabled;
                alert(`Failed to apply tweak: ${tweakName}`);
            }
        });
    });

    // Mocked metrics animation
    function animateMetrics() {
        const ring = document.querySelector('.ring-progress');
        if (ring) {
            // 283 is full circumference (2 * pi * 45)
            // 45% = 283 * (1 - 0.45) = 155
            ring.style.strokeDashoffset = '155';
        }
    }

    // Handle instant optimize click
    document.querySelector('.btn-primary-glow')?.addEventListener('click', (e) => {
        // Check for global pause first
        if (window.isPaused) {
            alert('Application is currently paused by administrator.');
            return;
        }

        e.target.textContent = 'Optimizing...';
        e.target.classList.add('pulse');

        setTimeout(() => {
            e.target.textContent = 'System Optimized!';
            e.target.style.background = '#4dff88';
            e.target.style.boxShadow = '0 10px 40px rgba(77, 255, 136, 0.4)';

            const pcMetric = document.querySelector('.metric-value');
            if (pcMetric) pcMetric.textContent = '98%';

            const ring = document.querySelector('.ring-progress');
            if (ring) ring.style.strokeDashoffset = (283 * (1 - 0.98)).toString();
        }, 2000);
    });

    // Admin: Global Pause logic
    const pauseToggle = document.getElementById('global-pause-toggle');
    const pauseStatusText = document.getElementById('pause-status-text');

    window.isPaused = false; // Initial local state

    pauseToggle?.addEventListener('change', (e) => {
        window.isPaused = e.target.checked;
        pauseStatusText.innerHTML = `Status: <b>${window.isPaused ? 'Paused' : 'Running'}</b>`;
        pauseStatusText.style.color = window.isPaused ? '#ff4d4d' : 'inherit';
    });

    // Admin: Announcement logic
    const sendAnnouncementBtn = document.getElementById('send-announcement-btn');
    const announcementInput = document.getElementById('announcement-input');
    const announcementList = document.getElementById('announcement-list');

    sendAnnouncementBtn?.addEventListener('click', () => {
        const text = announcementInput.value.trim();
        if (text) {
            announcementList.innerHTML = `<p>${text}</p>`;
            announcementInput.value = '';
            alert('Announcement broadcasted!');
        }
    });

    // PC Info Fetching (Real system information)
    async function fetchPCInfo() {
        try {
            const specs = await window.electron.ipcRenderer.invoke('get-pc-specs');
            document.getElementById('spec-cpu').textContent = specs.cpu;
            document.getElementById('spec-gpu').textContent = specs.gpu;
            document.getElementById('spec-ram').textContent = specs.ram;
        } catch (error) {
            console.error('Failed to fetch PC specs:', error);
            document.getElementById('spec-cpu').textContent = 'Error loading';
            document.getElementById('spec-gpu').textContent = 'Error loading';
            document.getElementById('spec-ram').textContent = 'Error loading';
        }
    }

    fetchPCInfo();
});
