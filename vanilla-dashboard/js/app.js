const App = {
    // UI Elements
    usernameInput: document.getElementById('usernameInput'),
    searchBtn: document.getElementById('searchBtn'),
    searchLoader: document.getElementById('searchLoader'),
    mainContent: document.getElementById('mainContent'),
    initialState: document.getElementById('initialState'),
    loadingState: document.getElementById('loadingState'),
    errorState: document.getElementById('errorState'),
    errorMessage: document.getElementById('errorMessage'),

    // Containers
    userProfile: document.getElementById('userProfile'),
    statsGrid: document.getElementById('statsGrid'),
    repoTableBody: document.getElementById('repoTableBody'),
    timeline: document.getElementById('timeline'),
    heatmapContainer: document.getElementById('heatmapContainer'),

    init() {
        this.searchBtn.addEventListener('click', () => this.handleSearch());
        this.usernameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleSearch();
        });

        // Handle window resize for chart
        window.addEventListener('resize', () => {
            if (this.currentActivity) {
                Chart.render('activityChart', this.currentActivity);
            }
        });
    },

    async handleSearch() {
        const username = this.usernameInput.value.trim();
        if (!username) return;

        this.showState('loading');
        this.currentActivity = null;

        try {
            const { activity, profile } = await Api.getAllUserData(username);

            if (!Array.isArray(activity)) {
                console.error('Activity is not an array:', activity);
                throw new Error('Invalid activity data received from server');
            }

            this.currentActivity = activity;
            this.renderDashboard(profile, activity);
            this.showState('main');
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
        this.userProfile.innerHTML = Components.renderProfile(profile);

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
