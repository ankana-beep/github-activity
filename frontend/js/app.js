const App = {
    // UI Elements (initialized in init)
    usernameInput: null,
    searchBtn: null,
    searchLoader: null,
    mainContent: null,
    initialState: null,
    loadingState: null,
    errorState: null,
    errorMessage: null,

    // Auth Elements (initialized in init)
    loginBtn: null,
    logoutBtn: null,
    userAccount: null,
    userAvatar: null,
    userName: null,

    // Containers (initialized in init)
    userProfile: null,
    statsGrid: null,
    repoTableBody: null,
    timeline: null,
    heatmapContainer: null,

    init() {
        // UI Elements
        this.usernameInput = document.getElementById('usernameInput');
        this.searchBtn = document.getElementById('searchBtn');
        this.searchLoader = document.getElementById('searchLoader');
        this.mainContent = document.getElementById('mainContent');
        this.initialState = document.getElementById('initialState');
        this.loadingState = document.getElementById('loadingState');
        this.errorState = document.getElementById('errorState');
        this.errorMessage = document.getElementById('errorMessage');

        // Auth Elements
        this.loginBtn = document.getElementById('loginBtn');
        this.logoutBtn = document.getElementById('logoutBtn');
        this.userAccount = document.getElementById('userAccount');
        this.userAvatar = document.getElementById('userAvatar');
        this.userName = document.getElementById('userName');

        // Containers
        this.userProfile = document.getElementById('userProfile');
        this.statsGrid = document.getElementById('statsGrid');
        this.repoTableBody = document.getElementById('repoTableBody');
        this.timeline = document.getElementById('timeline');
        this.heatmapContainer = document.getElementById('heatmapContainer');

        this.setupEventListeners();
        this.checkAuth();
    },

    setupEventListeners() {
        this.searchBtn.addEventListener('click', () => this.handleSearch());
        this.usernameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleSearch();
        });

        this.loginBtn.addEventListener('click', () => Api.login());
        this.logoutBtn.addEventListener('click', () => this.handleLogout());

        // Handle window resize for chart
        window.addEventListener('resize', () => {
            if (this.currentActivity) {
                Chart.render('activityChart', this.currentActivity);
            }
        });
    },

    async checkAuth() {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');

        if (code) {
            // Clear code from URL
            window.history.replaceState({}, document.title, window.location.pathname);
            this.showState('loading');
            try {
                const data = await Api.handleCallback(code);
                this.saveSession(data);
                this.updateAuthUI(data.user);
                this.handleSearch(data.user.login);
            } catch (error) {
                console.error('Auth failed:', error);
                this.showState('error');
                this.errorMessage.textContent = 'GitHub authentication failed.';
            }
            return;
        }

        const savedUser = localStorage.getItem('github_user');
        if (savedUser) {
            const user = JSON.parse(savedUser);
            this.updateAuthUI(user);
            this.handleSearch(user.login);
        }
    },

    saveSession(data) {
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('github_user', JSON.stringify(data.user));
    },

    handleLogout() {
        localStorage.removeItem('access_token');
        localStorage.removeItem('github_user');
        window.location.reload();
    },

    updateAuthUI(user) {
        if (!user) return;
        this.loginBtn.classList.add('hidden');
        this.userAccount.classList.remove('hidden');
        this.userAvatar.src = user.avatar_url || '';
        this.userName.textContent = user.name || user.login || 'User';
        this.usernameInput.value = user.login || '';
        this.usernameInput.disabled = false;
        this.usernameInput.placeholder = "Enter GitHub username...";
        this.searchBtn.disabled = false;
    },

    async handleSearch(preFilledUsername) {
        const username = preFilledUsername || this.usernameInput.value.trim();
        if (!username) return;

        if (preFilledUsername) this.usernameInput.value = preFilledUsername;

        this.showState('loading');
        this.currentActivity = null;

        try {
            const { activity, profile } = await Api.getAllUserData(username);

            if (!Array.isArray(activity)) {
                console.error('Activity is not an array:', activity);
                throw new Error('Invalid activity data received from server');
            }

            this.currentActivity = activity;
            this.showState('main');
            this.renderDashboard(profile, activity);
        } catch (error) {
            console.error('Search Error:', error);
            this.errorMessage.textContent = error.message;
            this.showState('error');
        }
    },

    showState(state) {
        this.initialState.classList.add('hidden');
        this.loadingState.classList.add('hidden');
        this.errorState.classList.add('hidden');
        this.mainContent.classList.add('hidden');
        this.searchBtn.disabled = state === 'loading';
        this.searchLoader.hidden = state !== 'loading';

        if (state === 'loading') this.loadingState.classList.remove('hidden');
        else if (state === 'error') this.errorState.classList.remove('hidden');
        else if (state === 'main') this.mainContent.classList.remove('hidden');
        else if (state === 'initial') this.initialState.classList.remove('hidden');
    },

    renderDashboard(profile, activity) {
        if (!Array.isArray(activity)) {
            console.error('renderDashboard called with non-array activity');
            return;
        }
        // Render Profile
        if (profile) {
            this.userProfile.innerHTML = Components.renderProfile(profile);
        }

        // Render Stats
        this.statsGrid.innerHTML = Components.renderStats(activity);

        // Render Chart
        Chart.render('activityChart', activity);

        // Render Repos (Top 6 active)
        const repos = {};
        activity.forEach(event => {
            if (!repos[event.repo]) repos[event.repo] = [];
            repos[event.repo].push(event);
        });

        const sortedRepos = Object.entries(repos)
            .sort((a, b) => b[1].length - a[1].length)
            .slice(0, 6);

        this.repoTableBody.innerHTML = sortedRepos
            .map(([name, events]) => Components.renderRepoRow(name, events))
            .join('');

        // Render Heatmap
        this.heatmapContainer.innerHTML = Components.renderHeatmap(activity);

        // Render Timeline (Last 10 events)
        this.timeline.innerHTML = activity
            .slice(0, 10)
            .map(event => Components.renderTimelineItem(event))
            .join('');
    }
};

// Initialize App
document.addEventListener('DOMContentLoaded', () => App.init());
