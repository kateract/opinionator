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
    console.log('participantJoin event received', participant);
    var opt = new Option(participant.username, participant.userID);
    opt.id = participant.sessionID;
    $('#participantList').append(opt);
});

ipcRenderer.on('participantLeave', (event, participant) => {
    $("#participantList #" + participant.sessionID).remove();
})
$(document).ready(function() {
    ipcRenderer.send('participantSubscribe');
})


