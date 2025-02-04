const express = require('express');
const os = require('os');
const { exec } = require('child_process');
const arp = require('node-arp');
const app = express();
const port = 3000;

app.use(express.urlencoded({ extended: true })); // Middleware to parse form data

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
    exec("nmap -sn 10.204.39.0/24", (err, stdout) => {
        if (err) return callback([]);
        const devices = stdout.split("\n")
            .filter(line => line.includes("Nmap scan report for"))
            .map(line => {
                const ip = line.split(" ")[4];
                return { ip, mac: "Unknown" };
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
       html += `<tr>
            <td>${device.ip}</td>
            <td>${device.mac}</td>
            <td><input type='checkbox' name='allow_${device.ip}' value='yes'></td>
         </tr>`;

    });
});

app.post('/update', (req, res) => {
    console.log('Received form data:', req.body); // Debugging
    res.send('<h2>Settings updated successfully!</h2><a href="/">Go Back</a>');
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
