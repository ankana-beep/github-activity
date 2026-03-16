const Components = {
    renderProfile(profile) {
        return `
            <img src="${profile.avatar_url}" alt="${profile.login}" class="avatar">
            <h2 class="profile-name">${profile.name || profile.login}</h2>
            <p class="profile-handle">@${profile.login}</p>
            ${profile.bio ? `<p class="profile-bio">${profile.bio}</p>` : ''}
            <div class="profile-stats">
                <div class="p-stat">
                    <span class="p-stat-val">${profile.followers}</span>
                    <span class="p-stat-label">Followers</span>
                </div>
                <div class="p-stat">
                    <span class="p-stat-val">${profile.following}</span>
                    <span class="p-stat-label">Following</span>
                </div>
                <div class="p-stat">
                    <span class="p-stat-val">${profile.public_repos}</span>
                    <span class="p-stat-label">Repos</span>
                </div>
            </div>
            <a href="${profile.html_url}" target="_blank" class="gh-link">View GitHub Profile</a>
        `;
    },

    calculateStreak(activity) {
        if (!activity.length) return 0;
        const dates = [...new Set(activity.map(e => e.created_at.split('T')[0]))]
            .map(d => new Date(d))
            .sort((a, b) => b - a);

        let streak = 0;
        let current = new Date();
        current.setHours(0, 0, 0, 0);

        for (let date of dates) {
            const diff = Math.floor((current - date) / (1000 * 60 * 60 * 24));
            if (diff <= 1) {
                streak++;
                current = date;
            } else {
                break;
            }
        }
        return streak;
    },

    renderStats(activity) {
        if (!Array.isArray(activity)) return '';

        // 1. Calculate basic counts
        const counts = {
            Push: 0,
            PRs: 0,
            Issues: 0,
            Creations: 0,
            Collaborations: 0,
            Engagement: 0
        };

        const repos = {};
        activity.forEach(event => {
            const type = event.type;
            const repo = event.repo;

            repos[repo] = (repos[repo] || 0) + 1;

            if (type === 'PushEvent') counts.Push++;
            else if (type === 'PullRequestEvent') counts.PRs++;
            else if (type === 'IssuesEvent' || type === 'IssueCommentEvent') counts.Issues++;
            else if (type === 'CreateEvent' || type === 'ForkEvent') counts.Creations++;
            else if (type === 'MemberEvent' || type === 'OrganizationEvent') counts.Collaborations++;
            else if (type === 'WatchEvent' || type === 'PublicEvent') counts.Engagement++;
        });

        // 2. Derive advanced metrics
        const topRepo = Object.entries(repos).sort((a, b) => b[1] - a[1])[0]?.[0]?.split('/')[1] || 'None';
        const streak = this.calculateStreak(activity);

        // 3. Define all potential cards
        const allStats = [
            { label: 'Recent Activity', value: activity.length, icon: '📈', alwaysShow: true },
            { label: 'Current Streak', value: streak > 0 ? `${streak} Days` : 0, icon: '🔥', priority: true },
            { label: 'Top Repository', value: topRepo, icon: '🏆', priority: true },
            { label: 'Push Events', value: counts.Push, icon: '🚀' },
            { label: 'Pull Requests', value: counts.PRs, icon: '🔁' },
            { label: 'Collaborations', value: counts.Collaborations, icon: '🤝' },
            { label: 'Issues/Comments', value: counts.Issues, icon: '💬' },
            { label: 'Creations/Forks', value: counts.Creations, icon: '🏗️' },
            { label: 'Stars/Engagement', value: counts.Engagement, icon: '✨' }
        ];

        // 4. Dynamic Filter: Show only non-zero or priority stats, limit to 6
        const activeStats = allStats
            .filter(s => s.alwaysShow || (s.value !== 0 && s.value !== 'None'))
            .slice(0, 6);

        return activeStats.map(stat => `
            <div class="stat-card">
                <div class="stat-header">
                    <span>${stat.label}</span>
                    <span>${stat.icon}</span>
                </div>
                <div class="stat-value" style="${typeof stat.value === 'string' && stat.value.length > 10 ? 'font-size: 1.2rem' : ''}">
                    ${stat.value}
                </div>
            </div>
        `).join('');
    },

    getEventIcon(type) {
        const icons = {
            PushEvent: '🚀',
            PullRequestEvent: '🔁',
            IssuesEvent: '🐛',
            CreateEvent: '⭐',
            WatchEvent: '👀',
            ForkEvent: '🍴',
            DeleteEvent: '🗑️'
        };
        return icons[type] || '📝';
    },

    formatDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    renderTimelineItem(event) {
        return `
            <div class="timeline-item">
                <div class="event-icon" title="${event.type}">
                    ${this.getEventIcon(event.type)}
                </div>
                <div class="event-content">
                    <div class="event-title">${event.type.replace('Event', '')} in ${event.repo}</div>
                    <div class="event-meta">
                        <span>${this.formatDate(event.created_at)}</span>
                    </div>
                </div>
            </div>
        `;
    },

    renderRepoRow(repoName, events) {
        const [owner, name] = repoName.split('/');
        return `
            <tr onclick="window.open('https://github.com/${repoName}', '_blank')">
                <td>
                    <div class="repo-cell">
                        <span class="repo-cell-name">${name}</span>
                        <span class="repo-cell-owner">${owner}</span>
                    </div>
                </td>
                <td>
                    <span class="table-badge">${events[0].type.replace('Event', '')}</span>
                </td>
                <td>
                    <span class="activity-count">${events.length}</span>
                </td>
            </tr>
        `;
    },

    renderHeatmap(activity) {

        console.log("activity ankana beep baap", activity)


        const weeksToShow = 24; // Show more weeks for a better dashboard feel
        const now = new Date();
        const dayOfWeek = now.getDay(); // 0 is Sunday

        // Calculate start date (Sunday of 'weeksToShow' ago)
        const startDate = new Date(now);
        startDate.setDate(now.getDate() - (weeksToShow * 7) - dayOfWeek);
        startDate.setHours(0, 0, 0, 0);

        // Count activity per day (Normalized to local date string)
        const activityCounts = {};
        activity.forEach(event => {
            const date = new Date(event.created_at);
            const dateStr = date.toLocaleDateString('en-CA'); // 'YYYY-MM-DD' in local time
            activityCounts[dateStr] = (activityCounts[dateStr] || 0) + 1;
        });

        const dates = [];
        const totalDays = (weeksToShow * 7) + dayOfWeek + 1;

        for (let i = 0; i < totalDays; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);
            const dateStr = date.toLocaleDateString('en-CA'); // MATCHING FORMAT
            const count = activityCounts[dateStr] || 0;

            let level = 0;
            if (count > 0) level = 1;
            if (count > 2) level = 2;
            if (count > 5) level = 3;
            if (count > 10) level = 4;

            dates.push({ date: dateStr, count, level });
        }

        const labels = `
            <div class="heatmap-labels">
                <span></span> <!-- Sunday empty label -->
                <span>Mon</span>
                <span></span>
                <span>Wed</span>
                <span></span>
                <span>Fri</span>
                <span></span>
            </div>
        `;

        const cells = dates.map(d => `
            <div class="heatmap-cell level-${d.level}" 
                 title="${d.date}: ${d.count} events">
            </div>
        `).join('');

        return `
            <div class="heatmap-wrapper">
                <div class="heatmap-container-outer">
                    ${labels}
                    <div class="heatmap-grid" id="heatmapGrid">
                        ${cells}
                    </div>
                </div>
            </div>
            <div class="heatmap-footer" style="display: flex; justify-content: flex-end; align-items: center; gap: 4px; font-size: 11px; margin-top: 12px; color: var(--text-secondary);">
                <span>Less</span>
                <div class="heatmap-cell level-0"></div>
                <div class="heatmap-cell level-1"></div>
                <div class="heatmap-cell level-2"></div>
                <div class="heatmap-cell level-3"></div>
                <div class="heatmap-cell level-4"></div>
                <span>More</span>
            </div>
        `;
    }
};
