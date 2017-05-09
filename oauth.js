const ipcMain = require('electron').ipcMain;
// Module to handle Oauth Requests
const electronOauth2 = require('electron-oauth2');
// Node Config info
const config = require('config');

ipcMain.on('oauthRequest', (event, scopes) => {
  oauthRequest(scopes)
    .then((token) => event.sender.send('oauthRequestApproved', token),
    (err) => event.sender.send('oauthRequestRejected', err))
});

function oauthRequest(scopes) {
  return new Promise((resolve, reject) => {
    if (!config.has('OAuth2')) { 
      reject(new Error('No default configuration detected.')); 
      return;
    };
    var authInfo = config.get('OAuth2');

    const windowParams = {
      alwaysOnTop: true,
      autoHideMenuBar: true,
      webPreferences: {
        nodeIntegration: false
      }
    };

    const options = {
      scope: scopes
    };

    const opinionOauth = electronOauth2(authInfo, windowParams);

    opinionOauth.getAccessToken(options)
      .then((token) => { resolve(token); },
      (err) => { reject(err); }
      );
  });
};