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
    console.log('Attempting Connection');
    ipcRenderer.send('connectInteractive');
    ipcRenderer.on('interactiveConnectionEstablished', (event, connection) => { 
        console.log('Interactive Connected');
    });
    ipcRenderer.on('interactiveConnectionError', (event, err) => {console.log(err);}); 
}

document.getElementById('connectButton').addEventListener('click', () => { connectToInteractive(); });

ipcRenderer.on('participantJoin', (event, participant) => {
    var select = document.getElementById('participantList')
    var opt = document.createElement('option');
    opt.id = participant.sessionID;
    opt.value = participant.username;
    opt.innerHTML = participant.username;
    select.appendChild(opt);
});

ipcRenderer.on('participantLeave', (event, participant) => {
    var select = document.getElementById('participantList');
    for(var i = select.length; i >= 0; i--) {
        if (select.options[i].id = participant.sessionID)
            select.remove(i);
    }

})

document.addEventListener('load', () => {
    ipcRenderer.send('participantSubscribe');
})

console.log($('#participantList #test').innerHTML);