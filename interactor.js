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
client.state.on('participantLeave', (participant) => {
    console.log(`${participants.find((p) => p.sessionID = participant.sessionID).username} Left`);
});

//add events for windows that want to subscribe
ipcMain.on('participantSubscribe', (event) => {
    console.log('window subscribed to participants');
    client.state.on('participantJoin', (participant) => {
        event.sender.send('participantJoin', participant);
    });

    client.state.on('participantLeave', (participant) => {
        event.sender.send('participantLeave', participant);
    });

    // event.sender.send('participantJoin', {sessionID: 'test1', username:'testone', userID: 12})
    // setTimeout(() => event.sender.send('participantLeave', {sessionID: 'test1'}), 5000);
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
                .then(() => setupDefaultBoard());
        }, (err) => { console.log('error on client open:', err); });

});


function makeButtons(amount) {
    const controls = [];
    const size = 10;
    for (let i = 0; i < amount; i++) {
        controls.push({
            controlID: `${i}`,
            kind: "button",
            text: names[i] + '\n0',
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
        counter.push(0);
        pushers.push([]);
    }
    return controls;
}

names = ['Nope', 'CarHorn', 'Bazinga', 'Drama', 'HeyListen'];
counter = [];
pushers = [];
var totPushers = 0;

function setupDefaultBoard() {
    const scene = client.state.getScene('default');
    scene.deleteAllControls();
    scene.createControls(makeButtons(names.length))
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
                                    }, (err) => console.log('Capture Transaction Error:', err));
                            }
                        }, (err) => { console.log('set timeout error', err) });
                });
            })
        })


}

function updateControlText(scene, controls) {
    var controlUpdates = [];
    for (var i = 0; i < controls.length; i++) {
        var pControl = controls[i];
        controlUpdates.push({
            controlID: pControl.controlID,
            etag: pControl.etag,
            progress: (counter[i] / (totPushers > 0 ? totPushers : 1)),
            text: names[i] + '\n' + Math.round((counter[i] / (totPushers > 0 ? totPushers : 1)) * 100).toString()
        })
    }
    client.updateControls({
        sceneID: scene.id,
        etag: scene.etag,
        controls: controlUpdates
    })
        //.then(() => control.setCooldown(counter[id] * 1000))
        .catch((err) => console.log('update error', err));
}

function MoveOrAddPusher(id, participant) {
    totPushers = 0
    for (var i = 0; i < pushers.length; i++) {
        for (var j = pushers[i].length - 1; j >= 0; j--) {
            //console.log(pushers[i][j]);
            if (pushers[i][j].userID == participant.userID) {
                pushers[i].splice(j, 1);
            }
        }
        counter[i] = pushers[i].length;
        totPushers += pushers[i].length;
    }
    pushers[id].push(participant);
    counter[id]++;
    totPushers++;
    //console.log(pushers);
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
