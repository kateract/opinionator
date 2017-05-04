/* tslint:disable:no-console */
import * as WebSocket from 'ws';

//import * as faker from 'faker';
import * as auth from 'auth.js';

import {
    delay,
    GameClient,
    IButtonData,
    IControlData,
    IParticipant,
    setWebSocket,
} from 'beam-interactive-node2';

// We need to tell the interactive client what type of websocket we are using.
setWebSocket(WebSocket);

// As we're on the Streamer's side we need a "GameClient" instance
const client = new GameClient();

// Log when we're connected to interactive
client.on('open', () => console.log('Connected to interactive'));

// These can be un-commented to see the raw JSON messages under the hood
// client.on('message', (err: any) => console.log('<<<', err));
// client.on('send', (err: any) => console.log('>>>', err));
// client.on('error', (err: any) => console.log(err));

// Now we open the connection passing in our authentication details and an experienceId.
client.open({
    authToken: auth.getAuthKey(),
    url: 'wss://interactive2-dal.beam.pro/gameClient',
    versionId: 33792,
});

/**
 * This makes button objects, it will make the amount of buttons we tell it to
 * we'll use it to create controls dynamically!
 */
function makeControls(amount: number): IControlData[] {
    const controls: IButtonData[] = [];
    const size = 10;
    for (let i = 0; i < amount; i++) {
        controls.push({
            controlID: `${i}`,
            kind: 'button',
            text: 'button',
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
               ],
            },
        );
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
    scene.createControls(makeControls(5))
        .then(() => delay(delayTime))
        .then(() => scene.deleteAllControls())
        .then(() => delay(delayTime))
        .then(() => loop());
}

/* Pull in the scenes stored on the server
 * then call ready so our controls show up.
 * then call loop() to begin our loop.
*/
client.synchronizeScenes()
    .then(() => client.ready(true))
    .then(() => loop());

client.state.on('participantJoin', (participant: IParticipant ) => {
    console.log(`${participant.username}(${participant.sessionID}) Joined`);
});
client.state.on('participantLeave', (participant: string ) => {
    console.log(`${participant} Left`);
});
/* tslint:enable:no-console */