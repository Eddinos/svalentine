const axios = require('axios');

exports.handler = async function(event, context, callback) {
    const { queryStringParameters } = event;

    const params = {
        client_id: process.env.CLIENT_ID_INSTAGRAM,
        client_secret: process.env.CLIENT_SECRET_INSTAGRAM,
        grant_type: 'authorization_code',
        redirect_uri: 'https://insta-photos-album.netlify.app/',
        code: queryStringParameters.code
    }
    var queryString = Object.keys(params).map(key => key + '=' + params[key]).join('&');

    const response = await axios.post('https://api.instagram.com/oauth/access_token', queryString, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    })

    callback(null, {
        statusCode: 200,
        body: JSON.stringify(response)
    })
}