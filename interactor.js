const interactive = require('beam-interactive-node2');
const ws = require('ws');
const player = require('play-sound')(opts = {});
const ipcMain = require('electron').ipcMain;
const https = require('https');

const delay = interactive.delay;

interactive.setWebSocket(ws);

const client = new interactive.GameClient();

client.on('open', () => {
    console.log('Connected to Interactive')
    client.synchronizeScenes()
        .then((res) => { return client.ready(true) })
        .then(() => loop());
});
client.on('error', (err) => console.log('error:', err));

client.state.on('participantJoin', (participant) => {
    console.log(`${participant.username}(${participant.sessionID}) Joined`);
});

client.state.on('participantLeave', (participant) => {
    console.log(`${participant.username} Left`);
});

ipcMain.on('participantSubscribe', (event) => {
    client.state.on('participantJoin', (participant) => {
        event.sender.send('participantJoin', participant);
    });

    client.state.on('participantLeave', (participant) => {
        event.sender.send('participantLeave', participant);
    });
})


// These can be un-commented to see the raw JSON messages under the hood
// client.on('message', (err) => console.log('<<<', err));
// client.on('send', (err) => console.log('>>>', err));
// client.on('error', (err) => console.log(err));

ipcMain.on('connectInteractive', (event, token) => {
    console.log('GotConnectionRequest');

    client.open({
        authToken: token,
        versionId: 33792
    }).catch((err) => { console.log(err); });

});


function makeControls(amount) {
    const controls = [];
    const size = 10;
    for (let i = 0; i < amount; i++) {
        controls.push({
            controlID: `${i}`,
            kind: "button",
            text: names[i] + '\n0',
            cost: 0,
            cooldown: 1000,
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
                    width: size,
                    height: size / 2,
                    x: i * size,
                    y: 1,
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

const delayTime = 2000;

names = ['Nope', 'CarHorn', 'Bazinga', 'Drama', 'HeyListen'];
counter = [];
pushers = [];
var totPushers = 0;

function loop() {
    const scene = client.state.getScene('default');
    scene.deleteAllControls();
    scene.createControls(makeControls(5))
        .then(controls => {
            controls.forEach((control) => {
                control.on('mousedown', (inputEvent, participant) => {
                    //control.disable()
                    control.setCooldown(1000)
                    .then(() => {
                        let id = parseInt(inputEvent.input.controlID);
                        MoveOrAddPusher(id, participant);

                        console.log(`${participant.username} pushed ${inputEvent.input.controlID}`);
                        // control.setText(names[id] + '\n' + (++counter[id]).toString())
                        //     .then(() => control.setCooldown(counter[id] * 1000))
                        //     .then(() => console.log('text updated'), (err) => console.log(err));

                        //console.log(control);
                        var controlUpdates = [];
                        for (var i = 0; i < controls.length; i++) {
                            var pControl = controls[i];
                            controlUpdates.push({
                                controlID: pControl.controlID,
                                etag: pControl.etag,
                                //cooldown: (counter[id] + 1) * 1000,
                                progress: (counter[i] / (totPushers > 0 ? totPushers : 1)),
                                text: names[i] + '\n' + Math.round((counter[i] / (totPushers > 0 ? totPushers : 1)) * 100).toString()
                            })
                        }
                        client.updateControls({
                            sceneID: 'default',
                            etag: scene.etag,
                            controls: controlUpdates
                        })
                            //.then(() => control.setCooldown(counter[id] * 1000))
                            .catch((err) => console.log('update error', err));

                        if (inputEvent.transactionID) {
                            client.captureTransaction(inputEvent.transactionID)
                                .then(() => {
                                    console.log(`Charged ${participant.username} ${control.cost} sparks!`);
                                });
                        }
                    }, (err) => { console.log('set timeout error', err) });
                });
            })
        })


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