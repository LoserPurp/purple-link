async function fetchAdminData() {
    const response = await fetch('/api/analytics');
    const data = await response.json();

    // Populate IP addresses
    const ipList = document.getElementById('ipList');
    data.mostUsedIPs.forEach(ip => {
        const li = document.createElement('li');
        li.style.padding = '0.5rem 0';
        li.style.borderBottom = '1px solid var(--border-color)';
        li.innerHTML = `<div style="display: flex; justify-content: space-between;"><span>${ip.address}</span><span style="color: var(--primary-color); font-weight: bold;">${ip.count}</span></div>`;
        ipList.appendChild(li);
    });

    // Populate User Agents
    const userAgentList = document.getElementById('userAgentList');
    data.mostUsedUserAgents.forEach(agent => {
        const li = document.createElement('li');
        li.style.padding = '0.5rem 0';
        li.style.borderBottom = '1px solid var(--border-color)';
        // Truncate long user agents
        const shortAgent = agent.agent.length > 40 ? agent.agent.substring(0, 40) + '...' : agent.agent;
        li.innerHTML = `<div style="display: flex; justify-content: space-between;" title="${agent.agent}"><span>${shortAgent}</span><span style="color: var(--primary-color); font-weight: bold;">${agent.count}</span></div>`;
        userAgentList.appendChild(li);
    });

    // Populate Requests
    const requestList = document.getElementById('requestList');
    data.requests.reverse().forEach(request => { // Show newest first
        const li = document.createElement('li');
        li.style.padding = '0.5rem';
        li.style.marginBottom = '0.5rem';
        li.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
        li.style.borderRadius = '4px';
        li.innerHTML = `<div style="font-size: 0.9rem; color: var(--text-muted);">${request.timestamp}</div>
                        <div><span style="color: var(--primary-color);">${request.ip}</span> - ${request.agent}</div>`;
        requestList.appendChild(li);
    });

    // Chart
    const ctx = document.getElementById('usageChart').getContext('2d');
    Chart.defaults.color = '#a3a3a3';
    Chart.defaults.borderColor = '#333333';
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.chartLabels,
            datasets: [{
                label: 'Requests per Endpoint',
                data: data.chartData,
                backgroundColor: 'rgba(147, 51, 234, 0.5)', // Purple with opacity
                borderColor: 'rgba(147, 51, 234, 1)', // Purple solid
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: '#333333'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: '#e5e5e5'
                    }
                }
            }
        }
    });
}

document.addEventListener('DOMContentLoaded', fetchAdminData);
