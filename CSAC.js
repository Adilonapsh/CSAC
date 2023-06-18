var fs = require('fs');
var readline = require('readline');
var {google} = require('googleapis');
var cron = require('node-cron');
var OAuth2 = google.auth.OAuth2;
const express = require('express');
const parser = require('body-parser');

const app = express();

var SCOPES = ['https://www.googleapis.com/auth/youtube.readonly'];
var TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH ||
    process.env.USERPROFILE) + '/.credentials/';
var TOKEN_PATH = TOKEN_DIR + 'youtube-nodejs-quickstart.json';

var aksesClient = YOUR_GOOGLE_CREDENTIAL_JSON;
// Load client secrets from a local file.
fs.readFile('client_secret.json', function processClientSecrets(err, content) {
  if (err) {
    console.log('Error pada saat membuka file : ' + err);
    return;
  }
  // Authorize a client with the loaded credentials, then call the YouTube API.
//   aksesClient = JSON.parse(content);
  authorize(JSON.parse(content), getChannel);
});


function authorize(credentials, callback) {
  var clientSecret = credentials.installed.client_secret;
  var clientId = credentials.installed.client_id;
  var redirectUrl = credentials.installed.redirect_uris[0];
  var oauth2Client = new OAuth2(clientId, clientSecret, redirectUrl);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, function(err, token) {
    if (err) {
      getNewToken(oauth2Client, callback);
    } else {
      oauth2Client.credentials = JSON.parse(token);
      callback(oauth2Client);
    }
  });
}

function getNewToken(oauth2Client, callback) {
  var authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES
  });
  console.log('Izinkan aplikasi mengunjungi url ini: ', authUrl);
  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question('Masukkan Kode yang ada dalam link: ', function(code) {
    rl.close();
    oauth2Client.getToken(code, function(err, token) {
      if (err) {
        console.log('Error pada saat mencoba mengambil akses token', err);
        return;
      }
      oauth2Client.credentials = token;
      storeToken(token);
      callback(oauth2Client);
    });
  });
}


function storeToken(token) {
  try {
    fs.mkdirSync(TOKEN_DIR);
  } catch (err) {
    if (err.code != 'EEXIST') {
      throw err;
    }
  }
  fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
    if (err) throw err;
    console.log('Token stored to ' + TOKEN_PATH);
  });
}
app.use(parser.json());

app.listen(2021,() =>{
  console.log('Server started on port 2021...');
});

app.get('/api/youtube/channel/:id',(req,res)=>{
    let id = req.params.id;
    var response = getChannel(id,'snippet,contentDetails,statistics',(response)=>{
      res.send(JSON.stringify({"status": 200, "error": null, "response": response}));
    });
});

app.get('/api/youtube/comment/:idvideo',(req,res)=>{
    let id = req.params.idvideo;
    var response = getComment(id,'snippet',(response)=>{
      res.send(JSON.stringify({"status": 200, "error": null, "response": response}));
    });
});

app.get('/api/youtube/playlist/:idplaylist',(req,res)=>{
    let id = req.params.idplaylist;
    var response = getPlaylist(id,'snippet',(response)=>{
      res.send(JSON.stringify({"status": 200, "error": null, "response": response}));
    });
});



function getChannel(idchannel, part, callback) {
  var auth = 'AIzaSyDWzIvflTuKNZXCMjcSlSgQ7roakUiFDBI';
  var service = google.youtube('v3');
  service.channels.list({
    auth: auth,
    part: part,
    id: idchannel

  }, function(err, response) {
    if (err) {
      console.log('Api Mengembalikan Error: ' + err);
      return;
    }
    var channels = response.data.items;
    if (channels.length == 0) {
      console.log('ID Tidak Ditemukan.');
    } else {
        var subs = channels[0];
        return callback(subs);
    }
  });
}

function getComment(videoid,part,callback) {
  auth = 'AIzaSyDWzIvflTuKNZXCMjcSlSgQ7roakUiFDBI';
  var service = google.youtube('v3');
  service.commentThreads.list({
    auth: auth,
    part: part,
    videoId: videoid
    // id: 'UCtmZ1i4uq2RAFm5TMauwjrQ'
  }, function(err, response) {
    if (err) {
      console.log('Api Mengembalikan Error: ' + err);
      return;
    }
    var data = response.data.items;
    var comments = [];
    // console.log(data);
    data.forEach(comment => {
          var com = comment.snippet.topLevelComment.snippet;
          comments.push(com);
          // console.log(com);
          // console.log(com.authorDisplayName+" : "+com.textOriginal);
      });
      return callback(comments);
      
  });
}
function getPlaylist(playlistid,part,callback) {
  auth = 'AIzaSyDWzIvflTuKNZXCMjcSlSgQ7roakUiFDBI';
  var service = google.youtube('v3');
  service.playlistItems.list({
    auth: auth,
    part: part,
    playlistId: playlistid
  }, function(err, response) {
    if (err) {
      console.log('Api Mengembalikan Error: ' + err);
      return;
    }
    var data = response.data.items;
    return callback(data);
  });
}