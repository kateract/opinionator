const interactive = require('beam-interactive-node2');
const ws = require('ws');
const auth = require('auth.js');
const player = require('play-sound')(opts = {});


const delay = interactive.delay;

interactive.setWebSocket(ws);

const client = new interactive.GameClient();

client.on('open', () => console.log('Connected to Interactive'));

// These can be un-commented to see the raw JSON messages under the hood
// client.on('message', (err) => console.log('<<<', err));
// client.on('send', (err) => console.log('>>>', err));
// client.on('error', (err) => console.log(err));


client.open({
    authToken: auth.getAuthKey(),
    url: 'wss://interactive2-dal.beam.pro/gameClient',
    versionId: 33792
})

function debug(msg) {console.log(msg)}
//const controls = [];
function makeControls(amount) {
    const controls = [];
    const size = 10;
    for (let i = 0; i < amount; i++) {
        controls.push({
            controlID: `${i}`,
            kind: "button",
            text: ``,
            cost: 1,
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
    }
    return controls;
}

const delayTime = 2000;

/* Loop creates 5 controls and adds them to the default scene.
 * It then waits delayTime milliseconds and then deletes them,
 * before calling itself again.
*/

function loop() {
    const scene = client.state.getScene('default');
    scene.deleteAllControls();
    scene.createControls(makeControls(5))
    .then(controls => {
        controls.forEach((control) => { 
            control.on('mousedown', (inputEvent, participant) => {
                console.log(`${participant.username} pushed, ${inputEvent.input.controlID}`);

                switch(parseInt(inputEvent.input.controlID)) {
                    case 0:
                        console.log('Nope');
                        playSound('Nope', '../Soundboard/nope.mp3', 100);
                        control.setText( "Nope")
                        .then(()=> console.log('text updated'), (err) => console.log(err));
                        break;
                    case 1:
                        break;
                    case 2:
                        break;
                    case 3:
                        break;
                    case 4:
                        break;
                    default: 
                        break;

                }
                //console.log(control);
                //client.updateControls( {scenes: [{sceneID: 'default', controls:[{controlID: control.controlID, cooldown: 5, cost: 1, keyCode: null, progress: 0,  text: control.text }]}]}).catch((err) => console.log(err));

                if (inputEvent.transactionID) {
                    client.captureTransaction(inputEvent.transactionID)
                    .then (() => { 
                        console.log(`Charged ${participant.username} ${control.cost} sparks!`);
                    });
                }
            });
        })
    })
        
        
}


/* Pull in the scenes stored on the server
 * then call ready so our controls show up.
 * then call loop() to begin our loop.
*/
client.synchronizeScenes()
    .then((res) => {console.log(res); return client.ready(true)})
    .then(() => loop());

client.state.on('participantJoin', (participant) => {
    console.log(`${participant.username}(${participant.sessionID}) Joined`);
});

client.state.on('participantLeave', (participant) => {
    console.log(`${participant} Left`);
});

function playSound(name, path, volume)
{
    console.log(name);

    player.play(path, {cmdmp3: [volume.toString()]}, function(err){ // {cmdmp3:['50']},
        if (err) {
            throw err; 
        }
        else {
            console.log('sound complete');
        }
    });
}