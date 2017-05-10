// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
var remote = require('electron').remote;
var Menu = remote.require('electron').Menu;
var ipcRenderer = require('electron').ipcRenderer;
var https = require('https');

var menu = Menu.buildFromTemplate([
    {
        label: 'Opinionator',
        submenu: [
            {
                label: 'Refresh',
                click: function () {
                    location.reload();
                }
            },           
            {
                label: 'Open Dev Tools...',
                click: function () {
                    remote.getCurrentWindow().openDevTools()
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
    $('#connectButton').html('Connecting...');
    ipcRenderer.send('oauthRequest', 'interactive:robot:self');
    ipcRenderer.on('oauthRequestApproved', (event, token) => {
        ipcRenderer.send('connectInteractive', token.access_token);
        ipcRenderer.on('interactiveConnectionEstablished', (event, connection) => {
            ipcRenderer.send('subscribeToPushers')
            ipcRenderer.on('pushersUpdated', (event, pushers) => updatePushers(pushers));
            console.log('Interactive Connected');
            $('#connectButton').html('Connected');

        });
        ipcRenderer.on('interactiveConnectionError', (event, err) => {
            console.log(event);
            $('#connectButton').html('Connect');
            WarningDialog.show(err.toString(), 'Interactive Connection Error');
        });

    })
    ipcRenderer.on('oauthRequestRejected', (event, err) => {
        console.log(err);
        $('#connectButton').html('Connect');
        WarningDialog.show(err.toString(), 'Authentication Error');
    })

}

$('#connectButton').on('click', () => { connectToInteractive(); });
$('select').on('change', (e) => {
    var optionSelected = $("option:selected", e.target);
    if (optionSelected.length > 0) {
        var valueSelected = optionSelected[0].value;
        updateProfilePic(valueSelected);
    }
})
$('select').on('focus', (e) => {
    var optionSelected = $("option:selected", e.target);
    if (optionSelected.length > 0) {
        var valueSelected = optionSelected[0].value;
        updateProfilePic(valueSelected);
    }
})
ipcRenderer.on('participantJoin', (event, participant) => {
    //console.log('participantJoin event received', participant);
    var opt = new Option(participant.username, participant.userID);
    opt.id = participant.sessionID;
    $('#participantList').append(opt);
});

ipcRenderer.on('participantLeave', (event, sessionID) => {
    $("#participantList #" + sessionID).remove();
})
$(document).ready(function () {
    ipcRenderer.send('participantSubscribe');
})


function updatePushers(pushers) {
    //console.log(pushers.pushers);
    var select = $("#pushData");
    select.empty();
    for (var i = 0; i < pushers.names.length; i++) {
        select.append(new Option(pushers.names[i], pushers.counter[i]));
        pushers.pushers[i].forEach(function (participant) {
            //console.log(participant);
            select.append(new Option("--" + participant.username, participant.userID));
        }, this);
    }

}

function updateProfilePic(value) {
    var path = '/api/v1/users/' + value + '/avatar';

    //console.log('https://beam.pro' + path);
    const options = {
        hostname: 'beam.pro',
        port: 443,
        path: path,
        method: 'GET'
    }
    var req = https.request(options, (res) => {
        console.log(res.statusCode);
        //console.log(res.headers);
        if (res.statusCode == 302) {
            console.log(res.headers.location);
            $('#profileImage').attr('src', res.headers.location);
        }
    })

    req.on('error', (e) => console.log(e));
    req.end();
}

var WarningDialog = { 
    show: function(warningText, warningTitle) {
        $('#warningDialog .headerText').html(warningTitle);
        $('#warningDialog .bodyText').html(warningText);
        $('#warningDialog').css('display', 'block');
    }
}