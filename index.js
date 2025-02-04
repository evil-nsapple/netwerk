const express = require('express');
const os = require('os');
const { exec } = require('child_process');
const arp = require('node-arp');
const app = express();
const port = 3000;

// Get local IP
const getLocalIP = () => {
    const interfaces = os.networkInterfaces();
    for (let iface of Object.values(interfaces)) {
        for (let details of iface) {
            if (details.family === 'IPv4' && !details.internal) {
                return details.address;
            }
        }
    }
    return 'Unknown';
};

// Scan network using arp-scan or ping sweep (Linux/macOS)
const scanNetwork = (callback) => {
    exec("arp -a", (err, stdout) => {
        if (err) return callback([]);
        const devices = stdout.split('\n')
            .filter(line => line.includes('.'))
            .map(line => {
                const parts = line.split(' ');
                return { ip: parts[1].replace(/[()]/g, ''), mac: parts[3] || 'Unknown' };
            });
        callback(devices);
    });
};

app.get('/', (req, res) => {
    scanNetwork((devices) => {
        const localIP = getLocalIP();
        let html = `<h2>Your IP: ${localIP}</h2><h3>Network Devices:</h3>`;
        html += `<form action='/update' method='POST'>`;
        html += `<table border='1'><tr><th>IP</th><th>MAC</th><th>Allow</th></tr>`;
        devices.forEach(device => {
            html += `<tr>
                        <td>${device.ip}</td>
                        <td>${device.mac}</td>
                        <td><input type='checkbox' name='allow_${device.ip}' checked></td>
                     </tr>`;
        });
        html += `</table><br><button type='submit'>Update</button></form>`;
        res.send(html);
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
