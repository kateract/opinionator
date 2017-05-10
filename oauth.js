const ipcMain = require('electron').ipcMain;
// Module to handle Oauth Requests
const electronOauth2 = require('electron-oauth2');
// Node Config info
const config = require('config');

const JsonDB = require('node-json-db');

var db = new JsonDB("OauthData", true, true) // TODO: set human readable to false

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
    getRefreshTokenFromDB(scopes)
      .then((token) => {
        opinionOauth.refreshToken(token.refresh_token)
          .then((token) => {
            db.push("/" + scopes, token, true);
            console.log(token);
            resolve(token);
          }, (err) => { reject(err); });
      }, () => {


        opinionOauth.getAccessToken(options)
          .then((token) => {
            db.push("/" + scopes, token, true);
            resolve(token);
          },
          (err) => { reject(err); }
          );
      });
  });
};

function getRefreshTokenFromDB(scopes) {
  return new Promise((resolve, reject) => {
    try {
      var token = db.getData("/" + scopes)
      if (token.refresh_token) {
        resolve(token);
      } else {
        reject(new Error(token.error));
      }
    } catch (error) {
      reject(new Error(error));
    }

  })
}