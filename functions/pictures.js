const axios = require('axios')

exports.handler = function(event, context, callback) {
    app.get('/', async function (req, res) {
        // axios.post('https://oauth2.googleapis.com/token' + `?client_secret=163155886071-ij8bk8o8a972bq6ad5ug8n5vr0dthcni.apps.googleusercontent.com&client_id=23phMHdM4t_mDm6tlNWsmC1V&grant_type=refresh_token&refresh_token=1//0fg-sj3Pkly6pCgYIARAAGA8SNwF-L9IrDVQrAh_VQBbDQrKhndjBV2Bo6wqZt4el5VEeVVu_OwOyaSiff39ox5a6na8ZG0CWOLE`).catch(console.log)
    
        let { data } = await axios.get(`https://api.flickr.com/services/rest/?method=flickr.people.getPublicPhotos&api_key=${FLICKER_KEY}&format=json&nojsoncallback=1&user_id=${FLCIKER_ACCOUNT_ID}&extras=original_format`)
         
        const photosList = data.photos.photo.map(({farm, server, id, secret, originalsecret, originalformat}) => ({
          small: `https://farm${farm}.staticflickr.com/${server}/${id}_${secret}_q.jpg`,
          origin: `https://farm${farm}.staticflickr.com/${server}/${id}_${originalsecret}_o.${originalformat}`
        }))

        callback(null, {
            statusCode: 200,
            body: JSON.stringify({
                    photosList
                })
        });
    }
}