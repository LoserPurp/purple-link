        // Fetch data and populate the lists and chart
        async function fetchAdminData() {
            const response = await fetch('/admin/data');
            const data = await response.json();

            // Populate IP addresses
            const ipList = document.getElementById('ipList');
            data.mostUsedIPs.forEach(ip => {
                const li = document.createElement('li');
                li.textContent = `${ip.address}: ${ip.count}`;
                ipList.appendChild(li);
            });

            // Populate User Agents
            const userAgentList = document.getElementById('userAgentList');
            data.mostUsedUserAgents.forEach(agent => {
                const li = document.createElement('li');
                li.textContent = `${agent.agent}: ${agent.count}`;
                userAgentList.appendChild(li);
            });

            // Populate Requests
            const requestList = document.getElementById('requestList');
            data.requests.forEach(request => {
                const li = document.createElement('li');
                li.textContent = `${request.timestamp} - ${request.ip} - ${request.agent}`;
                requestList.appendChild(li);
            });

            // Chart
            const ctx = document.getElementById('usageChart').getContext('2d');
            const chart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: data.chartLabels,
                    datasets: [{
                        label: 'Requests per Endpoint',
                        data: data.chartData,
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        }

        fetchAdminData();