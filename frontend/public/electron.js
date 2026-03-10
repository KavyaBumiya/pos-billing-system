const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

let mainWindow;
let backendProcess;

function startBackend() {
  const backendPath = app.isPackaged
    ? path.join(process.resourcesPath, 'backend')
    : path.join(__dirname, '..', '..', 'backend');

  const pythonExe = process.platform === 'win32' ? 'python' : 'python3';
  backendProcess = spawn(pythonExe, ['app.py'], {
    cwd: backendPath,
    stdio: 'pipe',
    shell: true,
  });

  backendProcess.stdout.on('data', (d) => console.log('Backend:', d.toString()));
  backendProcess.stderr.on('data', (d) => console.error('Backend err:', d.toString()));
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    title: 'Bumiya POS - Billing System',
    icon: path.join(__dirname, 'icon.ico'),
  });

  Menu.setApplicationMenu(null);

  const startUrl = isDev
    ? 'http://localhost:3000'
    : `file://${path.join(__dirname, '../build/index.html')}`;

  mainWindow.loadURL(startUrl);

  mainWindow.on('closed', () => { mainWindow = null; });
}

app.on('ready', () => {
  if (!isDev) startBackend();
  setTimeout(createWindow, isDev ? 0 : 2000);
});

app.on('window-all-closed', () => {
  if (backendProcess) backendProcess.kill();
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) createWindow();
});
