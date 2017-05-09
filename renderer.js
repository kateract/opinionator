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
                click: function () {
                    console.log('Prefs');
                }
            },
            {
                label: 'Quit',
                click: function () {
                    this.close();
                }

            }
        ]
    }
])

Menu.setApplicationMenu(menu);

function connectToInteractive() {
    console.log('Attempting Connection');
    ipcRenderer.send('oauthRequest', 'interactive:robot:self');
    ipcRenderer.on('oauthRequestApproved', (event, token) => {
        ipcRenderer.send('connectInteractive', token.access_token);
        ipcRenderer.on('interactiveConnectionEstablished', (event, connection) => {
            console.log('Interactive Connected');
        });
        ipcRenderer.on('interactiveConnectionError', (event, err) => { console.log(err); });
    })
    ipcRenderer.on('oauthRequestRejected', (err) => {
        console.log(err);
    })

}

$('#connectButton').on('click', () => { connectToInteractive(); });

ipcRenderer.on('participantJoin', (event, participant) => {
    $('#participantList').append('<option>', {
        value: participant.sessionId,
        text: participant.username
    })
});

ipcRenderer.on('participantLeave', (event, participant) => {
    var select = document.getElementById('participantList');
    for (var i = select.length; i >= 0; i--) {
        if (select.options[i].id = participant.sessionID)
            select.remove(i);
    }

})

document.addEventListener('load', () => {
    ipcRenderer.send('participantSubscribe');
})
