const {app, BrowserWindow, Menu, MenuItem} = require('electron');
const {dialog} = require('electron');
const path = require('path');
const url = require('url');
const {ipcMain} = require('electron');
var PDFScraper = require('./libraries/pdf_scraper');
var pdfScraper = new PDFScraper();

const template = [
    {
        label: 'File',
        submenu: [
            {role: 'quit'}
        ]
    },
    {
        label: 'Edit',
        submenu: [
            {role: 'undo'},
            {role: 'redo'},
            {type: 'separator'},
            {role: 'cut'},
            {role: 'copy'},
            {role: 'paste'},
            {role: 'pasteandmatchstyle'},
            {role: 'delete'},
            {role: 'selectall'}
        ]
    },
    {
        label: 'View',
        submenu: [
            {role: 'reload'},
            {role: 'forcereload'},
            {role: 'toggledevtools'},
            {type: 'separator'},
            {role: 'togglefullscreen'}
        ]
    },
    {
        role: 'window',
        submenu: [
            {role: 'minimize'},
            {role: 'close'}
        ]
    },
    {
        role: 'help',
        submenu: [
            {
                label: 'Learn More',
                click () { require('electron').shell.openExternal('http://www.lusfikars.space/') }
            }
        ]
    }
];

let win;

function createWindow () {
    win = new BrowserWindow({
        width: 800, 
        height: 500,
        minWidth: 800,
        minHeight: 500,
        maxWidth: 800,
        maxHeight: 500,
        maximizable: false
    });

    win.loadURL(url.format({
        pathname: path.join(__dirname, 'renderers/home.html'),
        protocol: 'file:',
        slashes: true
    }));
    
    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);

    win.on('closed', () => {
        win = null
    });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (win === null) {
        createWindow();
    }
});

//
ipcMain.on('open-file', (event, path) => {
    dialog.showOpenDialog({
        properties: ['openDirectory']
    },
    function (fileNames) {
        if(fileNames === undefined){
            console.log("No file selected");
        }else{           
            console.log(fileNames[0]);
            win.webContents.send('set-directory-path', fileNames[0]);
        }
    });
});

ipcMain.on('start-scraping', (event, arg) => {
    pdfScraper.setOnScrapeStartedCallback(function(){
        win.webContents.send('toggle-start-button', true);
    });

    pdfScraper.setOnScrapeStoppedCallback(function(){
        win.webContents.send('toggle-start-button', false);
    });

    pdfScraper.setOnScrapeProgressCallback(function(prog){
        win.webContents.send('set-progress', prog.toString());
    });

    pdfScraper.setScrapeArgs(arg);
    pdfScraper.start();
});

ipcMain.on('stop-scraping', (event, arg) => {
    pdfScraper.stop();
});