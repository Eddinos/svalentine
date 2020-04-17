const axios = require('axios')

exports.handler = function(event, context, callback) {
    let { data } = await axios.get(`https://api.flickr.com/services/rest/?method=flickr.people.getPublicPhotos&api_key=${FLICKER_KEY}&format=json&nojsoncallback=1&user_id=${FLCIKER_ACCOUNT_ID}&extras=original_format`)
        
    const photosList = data.photos.photo.map( ({farm, server, id, secret, originalsecret, originalformat}) => ({
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