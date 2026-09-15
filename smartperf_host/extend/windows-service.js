const Service = require('node-windows').Service;

const svc = new Service({
    name: 'HiSmartPerfHostExtend',
    description: 'Start HiSmartPerfHostExtend as a Windows service.',
    script: 'app.js'
});
svc.on('install', () => {
    svc.start();
});
svc.install();