// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
var remote = require('electron').remote;
var Menu = remote.require('electron').Menu;
var ipcRenderer = require('electron').ipcRenderer;

var menu = Menu.buildFromTemplate([
    {
        label: 'Opinionator',
        submenu: [
            {
                label: 'Prefs',
                click: function() {
                    console.log('Prefs');
                }
            },
            {
                label: 'Quit',
                click: function() {
                     this.close();
                }

            }
        ]
    }
])

Menu.setApplicationMenu(menu);

function connectToInteractive() {
    ipcRenderer.send('interactiveConnect');
    ipcRenderer.on('interactiveConnectionEstablished', () => { 
        console.log('Interactive Connected');
    });
}