const Chart = {
    render(canvasId, activity) {
        if (!Array.isArray(activity)) return;
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const container = canvas.parentElement;

        // Responsive canvas
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;

        const padding = 40;
        const width = canvas.width - padding * 2;
        const height = canvas.height - padding * 2;

        // Group activity by date
        const activityByDate = {};
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            last7Days.push(dateStr);
            activityByDate[dateStr] = 0;
        }

        activity.forEach(event => {
            const dateStr = event.created_at.split('T')[0];
            if (activityByDate[dateStr] !== undefined) {
                activityByDate[dateStr]++;
            }
        });

        const data = last7Days.map(date => activityByDate[date]);
        const maxVal = Math.max(...data, 5); // Minimum scale of 5

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw Axes
        ctx.strokeStyle = '#30363d';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, height + padding);
        ctx.lineTo(width + padding, height + padding);
        ctx.stroke();

        // Draw Data (Lines)
        const stepX = width / (last7Days.length - 1);

        // Gradient for the line
        const gradient = ctx.createLinearGradient(0, padding, 0, height + padding);
        gradient.addColorStop(0, '#58a6ff');
        gradient.addColorStop(1, '#3fb950');

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 3;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        ctx.beginPath();
        data.forEach((val, i) => {
            const x = padding + i * stepX;
            const y = height + padding - (val / maxVal) * height;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();

        // Draw points and labels
        data.forEach((val, i) => {
            const x = padding + i * stepX;
            const y = height + padding - (val / maxVal) * height;

            // Draw point
            ctx.fillStyle = '#58a6ff';
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fill();

            // Label
            ctx.fillStyle = '#8b949e';
            ctx.font = '10px Inter';
            ctx.textAlign = 'center';
            const label = last7Days[i].split('-').slice(1).join('/'); // MM/DD
            ctx.fillText(label, x, height + padding + 20);

            if (val > 0) {
                ctx.fillStyle = '#f0f6fc';
                ctx.fillText(val, x, y - 10);
            }
        });
    }
};
