const API_BASE = 'http://localhost:8001';
const GITHUB_API_BASE = 'https://api.github.com';

const Api = {
    async fetchUserActivity(username) {
        try {
            const response = await fetch(`${API_BASE}/activity/${username}`);
            console.log(`Fetch ${API_BASE}/activity/${username} status:`, response.status);
            if (!response.ok) {
                if (response.status === 404) throw new Error('User not found');
                throw new Error('Failed to fetch activity');
            }
            const data = await response.json();
            console.log('Raw API data:', data);
            if (data.error) throw new Error(data.error);
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    async fetchUserProfile(username) {
        try {
            const response = await fetch(`${GITHUB_API_BASE}/users/${username}`);
            if (!response.ok) {
                if (response.status === 404) throw new Error('GitHub profile not found');
                throw new Error('Failed to fetch profile');
            }
            return await response.json();
        } catch (error) {
            console.error('GitHub API Error:', error);
            throw error;
        }
    },

    async getAllUserData(username) {
        // Fetch both in parallel
        const [activity, profile] = await Promise.all([
            this.fetchUserActivity(username),
            this.fetchUserProfile(username)
        ]);

        return { activity, profile };
    }
};
