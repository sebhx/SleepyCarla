const http = require('http');
const fs = require('fs');
const path = require('path');

// Create a simple HTML test page
const testHTML = `
<!DOCTYPE html>
<html>
<head>
    <title>Network Test</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: Arial, sans-serif;
            text-align: center;
            padding: 50px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            margin: 0;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
        }
        h1 { font-size: 3em; margin-bottom: 20px; }
        p { font-size: 1.5em; margin: 10px 0; }
        .success { color: #4CAF50; font-weight: bold; }
        .info { background: rgba(255,255,255,0.1); padding: 20px; border-radius: 10px; margin: 20px 0; }
        button {
            background: #4CAF50;
            color: white;
            border: none;
            padding: 15px 30px;
            font-size: 1.2em;
            border-radius: 5px;
            cursor: pointer;
            margin: 10px;
        }
        button:hover { background: #45a049; }
        #result { margin-top: 20px; padding: 15px; background: rgba(255,255,255,0.1); border-radius: 5px; }
    </style>
</head>
<body>
    <h1>🎉 SUCCESS!</h1>
    <p class="success">Your iPhone can connect to this server!</p>
    
    <div class="info">
        <p><strong>Server Info:</strong></p>
        <p>Time: <span id="time"></span></p>
        <p>User Agent: <span id="userAgent"></span></p>
        <p>IP: <span id="clientIP"></span></p>
    </div>
    
    <button onclick="testAPI()">Test API Call</button>
    <button onclick="location.reload()">Refresh</button>
    
    <div id="result"></div>
    
    <script>
        document.getElementById('time').textContent = new Date().toLocaleString();
        document.getElementById('userAgent').textContent = navigator.userAgent;
        
        // Try to fetch client IP from server
        fetch('/client-info')
            .then(r => r.json())
            .then(data => {
                document.getElementById('clientIP').textContent = data.ip || 'Unknown';
            })
            .catch(e => {
                document.getElementById('clientIP').textContent = 'Could not fetch';
            });
        
        function testAPI() {
            const result = document.getElementById('result');
            result.innerHTML = '<p>Testing API...</p>';
            
            fetch('/api/test')
                .then(response => response.json())
                .then(data => {
                    result.innerHTML = '<p style="color: #4CAF50;">✅ API Test Successful!</p><pre>' + JSON.stringify(data, null, 2) + '</pre>';
                })
                .catch(error => {
                    result.innerHTML = '<p style="color: #ff6b6b;">❌ API Test Failed:</p><pre>' + error.message + '</pre>';
                });
        }
    </script>
</body>
</html>
`;

const server = http.createServer((req, res) => {
    const clientIP = req.headers['x-forwarded-for'] || 
                     req.connection.remoteAddress || 
                     req.socket.remoteAddress ||
                     (req.connection.socket ? req.connection.socket.remoteAddress : null);
    
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url} from ${clientIP}`);
    
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    if (req.url === '/') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(testHTML);
    } else if (req.url === '/client-info') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            ip: clientIP,
            userAgent: req.headers['user-agent'],
            timestamp: new Date().toISOString(),
            headers: req.headers
        }));
    } else if (req.url === '/api/test') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: true,
            message: 'Test API endpoint working!',
            timestamp: new Date().toISOString(),
            server: 'Simple Node.js Test Server'
        }));
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
    }
});

const PORT = 3000;
const HOST = '0.0.0.0';

server.listen(PORT, HOST, () => {
    console.log(`\n🚀 Test server running on:`);
    console.log(`   Local:    http://localhost:${PORT}`);
    console.log(`   Network:  http://[YOUR-IP]:${PORT}`);
    console.log(`\nTry accessing from your iPhone using your computer's IP address.`);
    console.log(`\nPress Ctrl+C to stop the server.`);
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use. Trying port ${PORT + 1}...`);
        server.listen(PORT + 1, HOST);
    } else {
        console.error('❌ Server error:', err);
    }
});
