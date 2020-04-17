const express = require('express')
const app = express()
const axios = require('axios')
const {google} = require('googleapis');
const privatekey = require('./private-key.json')

const FLICKER_KEY = '8ef8133f2e39de14de762f4690c3bc24'
const FLCIKER_ACCOUNT_ID = '187687927@N07'


// const drive = google.drive('v3')
// let jwtClient = new google.auth.JWT(
//   privatekey.client_email,
//   null,
//   privatekey.private_key,
//   ['https://www.googleapis.com/auth/drive'])

// const oauth2Client = new google.auth.OAuth2(
//     '163155886071-ij8bk8o8a972bq6ad5ug8n5vr0dthcni.apps.googleusercontent.com',
//     '23phMHdM4t_mDm6tlNWsmC1V',
//     'http://localhost:9000/authcb'
//   );

//   const url = oauth2Client.generateAuthUrl({
//     // 'online' (default) or 'offline' (gets refresh_token)
//     access_type: 'offline',
  
//     // If you only need one scope you can pass it as a string
//     scope: 'https://www.googleapis.com/auth/photoslibrary.readonly'
//   });

  

const PORT = 9000

const token = 'AIzaSyD_OwMOx7fwvG26zeQIHShuyq-Bl57Klp8';

app.get('/', async function (req, res) {
    // axios.post('https://oauth2.googleapis.com/token' + `?client_secret=163155886071-ij8bk8o8a972bq6ad5ug8n5vr0dthcni.apps.googleusercontent.com&client_id=23phMHdM4t_mDm6tlNWsmC1V&grant_type=refresh_token&refresh_token=1//0fg-sj3Pkly6pCgYIARAAGA8SNwF-L9IrDVQrAh_VQBbDQrKhndjBV2Bo6wqZt4el5VEeVVu_OwOyaSiff39ox5a6na8ZG0CWOLE`).catch(console.log)

    let { data } = await axios.get(`https://api.flickr.com/services/rest/?method=flickr.people.getPublicPhotos&api_key=${FLICKER_KEY}&format=json&nojsoncallback=1&user_id=${FLCIKER_ACCOUNT_ID}&extras=original_format`)
     
    const photosList = data.photos.photo.map(({farm, server, id, secret, originalsecret, originalformat}) => ({
      small: `https://farm${farm}.staticflickr.com/${server}/${id}_${secret}_q.jpg`,
      origin: `https://farm${farm}.staticflickr.com/${server}/${id}_${originalsecret}_o.${originalformat}`
    }))

    res.send(photosList)
    
    //authenticate request
    // jwtClient.authorize(function (err, tokens) {
    //   if (err) {
    //     console.log(err);
    //     return;
    //   } else {
    //     console.log("Successfully connected!", jwtClient.credentials);
    //   }

    //   drive.files.list({ auth: jwtClient }, (listErr, resp) => {
    //     if (listErr) {
    //       console.log(listErr);
    //       return;
    //     }
    //     console.log(resp.data.files)
        // resp.files.forEach((file) => {
        //   console.log(`${file.name} (${file.mimeType})`);
        // });
      // });
    // });

    // console.log('token', tokenRes)

    // axios.get('https://photoslibrary.googleapis.com/v1/albums', {
    //     headers: {
    //       'Authorization': `Bearer ${jwtClient.credentials.access_token}`
    //     }
    //   }).then(response => res.send(response))
    //   .catch(console.log)
      // const {tokens} = await oauth2Client.getToken(code)
      // axios.get(url).then(r => res.send(r.data))

  //     drive.files.list({ auth: jwtClient }, (listErr, resp) => {
  //   if (listErr) {
  //     console.log(listErr);
  //     return;
  //   }
  //   resp.files.forEach((file) => {
  //     console.log(`${file.name} (${file.mimeType})`);
  //   });
  // });
})

app.get('/authcb', (req, res) => {
    res.send('hello')
})

app.listen(PORT, function () {
console.log('there will be dragons')
})