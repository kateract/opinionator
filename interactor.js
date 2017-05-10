const interactive = require('beam-interactive-node2');
const ws = require('ws');
const player = require('play-sound')(opts = {});
const ipcMain = require('electron').ipcMain;
const https = require('https');

const delay = interactive.delay;

//set web socket for interactive client
interactive.setWebSocket(ws);

//open the client object
const client = new interactive.GameClient();

//catch any client errors
client.on('error', (err) => console.log('error:', err));

//console log joining participants
var participants = [];
client.state.on('participantJoin', (participant) => {
    participants.push(participant);
    console.log(`${participant.username}(${participant.sessionID}) Joined`);
});

//console log leaving participants
client.state.on('participantLeave', (sessionID) => {
    console.log(`${participants.find((p) => p.sessionID == sessionID).username} Left`);
    participants.splice(participants.findIndex((p) => p.sessionID == sessionID), 1);
});

//add events for windows that want to subscribe
ipcMain.on('participantSubscribe', (event) => {
    console.log('window subscribed to participants');
    client.state.on('participantJoin', (participant) => {
        event.sender.send('participantJoin', participant);
    });

    client.state.on('participantLeave', (sessionID) => {
        event.sender.send('participantLeave', sessionID);
    });
})

var pushSubscribers = [];
ipcMain.on('subscribeToPushers', (event) => {
    pushSubscribers.push(event.sender);
}) 

// These can be un-commented to see the raw JSON messages under the hood
// client.on('message', (err) => console.log('<<<', err));
// client.on('send', (err) => console.log('>>>', err));
// client.on('error', (err) => console.log(err));

//recieve a connect to interactive request
ipcMain.on('connectInteractive', (event, token) => {
    console.log('Received Interactive Connection Request');

    client.open({
        authToken: token,
        versionId: 33792
    })
        .then(() => {
            client.synchronizeScenes()
                .then((res) => { return client.ready(true) })
                .then(() => setupDefaultBoard())
                .then((controls) => { 
                    event.sender.send('interactiveConnectionEstablished')
                })
        }, (err) => { console.log('error on client open:', err); });

});


function makeButtons(amount) {
    const controls = [];
    defaultButtons.counter = [];
    defaultButtons.pushers = [];
    defaultButtons.totPushers = 0;

    const size = 10;
    for (let i = 0; i < amount; i++) {
        controls.push({
            controlID: `${i}`,
            kind: "button",
            text: defaultButtons.names[i] + '\n0',
            cost: 0,
            position: [
                {
                    size: 'large',
                    width: size,
                    height: size / 2,
                    x: i * size,
                    y: 1,
                },
                {
                    size: 'small',
                    width: size / 2,
                    height: size / 2,
                    x: 1,
                    y: i * size / 2,
                },
                {
                    size: 'medium',
                    width: size,
                    height: size,
                    x: i * size,
                    y: 1,
                },
            ]
        })
        defaultButtons.counter.push(0);
        defaultButtons.pushers.push([]);
    }
    return controls;
}
var defaultButtons = {
    names: ['Nope', 'CarHorn', 'Bazinga', 'Drama', 'HeyListen'],
    counter: [],
    pushers: [],
    totPushers: 0
}

function setupDefaultBoard() {
    return new Promise((resolve, reject) => {
    const scene = client.state.getScene('default');
    scene.deleteAllControls();
    scene.createControls(makeButtons(defaultButtons.names.length))
        .then(controls => {
            controls.forEach((control) => {
                control.on('mousedown', (inputEvent, participant) => {
                    control.setCooldown(1000)
                        .then(() => {
                            let id = parseInt(inputEvent.input.controlID);
                            MoveOrAddPusher(id, participant);

                            console.log(`${participant.username} pushed ${inputEvent.input.controlID}`);

                            updateControlText(scene, controls);

                            if (inputEvent.transactionID) {
                                client.captureTransaction(inputEvent.transactionID)
                                    .then(() => {
                                        console.log(`Charged ${participant.username} ${control.cost} sparks!`);
                                    }, (err) => reject(err));
                            }
                            pushSubscribers.forEach((sub) => sub.send('pushersUpdated', defaultButtons));
                        }, (err) => { reject(err) });
                });
            });
            resolve(controls);
        })

    });
}

function updateControlText(scene, controls) {
    var controlUpdates = [];
    for (var i = 0; i < controls.length; i++) {
        var pControl = controls[i];
        controlUpdates.push({
            controlID: pControl.controlID,
            etag: pControl.etag,
            progress: (defaultButtons.counter[i] / (defaultButtons.totPushers > 0 ? defaultButtons.totPushers : 1)),
            text: defaultButtons.names[i] + '\n' + Math.round((defaultButtons.counter[i] / (defaultButtons.totPushers > 0 ? defaultButtons.totPushers : 1)) * 100).toString()
        })
    }
    client.updateControls({
        sceneID: scene.sceneID,
        etag: scene.etag,
        controls: controlUpdates
    })
        //.then(() => control.setCooldown(counter[id] * 1000))
        .catch((err) => console.log('update error', err));
}

function MoveOrAddPusher(id, participant) {
    defaultButtons.totPushers = 0
    for (var i = 0; i < defaultButtons.pushers.length; i++) {
        for (var j = defaultButtons.pushers[i].length - 1; j >= 0; j--) {
            //console.log(pushers[i][j]);
            if (defaultButtons.pushers[i][j].userID == participant.userID) {
                defaultButtons.pushers[i].splice(j, 1);
            }
        }
        defaultButtons.counter[i] = defaultButtons.pushers[i].length;
        defaultButtons.totPushers += defaultButtons.pushers[i].length;
    }
    defaultButtons.pushers[id].push(participant);
    defaultButtons.counter[id]++;
    defaultButtons.totPushers++;
    console.log(defaultButtons.pushers);
}



function playSound(name, path, volume) {
    //console.log(name);

    player.play(path, { cmdmp3: [volume.toString()] }, function (err) { // {cmdmp3:['50']},
        if (err) {
            throw err;
        }
        else {
            //console.log('sound complete');
        }
    });
}



                        // switch (id) {
                        //     case 0:
                        //         playSound('Nope', '../Soundboard/nope.mp3', 100);
                        //         break;
                        //     case 1:
                        //         playSound('CarHorn', '../Soundboard/Ahooga.mp3', 100);
                        //         break;
                        //     case 2:
                        //         playSound('Bazinga', '../Soundboard/bazinga.mp3', 100);
                        //         break;
                        //     case 3:
                        //         playSound('Drama', '../Soundboard/drama.mp3', 100);
                        //         break;
                        //     case 4:
                        //         playSound('HeyListen', '../Soundboard/hey_listen.mp3', 100);
                        //         break;
                        //     default:
                        //         break;

                        // }


                        // control.setText(names[id] + '\n' + (++counter[id]).toString())
                        //     .then(() => control.setCooldown(counter[id] * 1000))
                        //     .then(() => console.log('text updated'), (err) => console.log(err));
