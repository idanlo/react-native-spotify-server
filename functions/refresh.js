import { decrypt, postRequest, encrypt, spotifyEndpoint } from '../utils';

exports.handler = async (event, context) => {
    try {
        const body = JSON.parse(
            '{"' +
                decodeURI(event.body)
                    .replace(/"/g, '\\"')
                    .replace(/&/g, '","')
                    .replace(/=/g, '":"') +
                '"}'
        );
        // ensure refresh token parameter
        if (!body.refresh_token) {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    error: 'Refresh token is missing from body'
                })
            };
        }

        // decrypt token
        const refreshToken = decrypt(body.refresh_token);
        // build request data
        const reqData = {
            grant_type: 'refresh_token',
            refresh_token: refreshToken
        };
        // get new token from Spotify API
        const { response, result } = await postRequest(
            spotifyEndpoint,
            reqData
        );

        // encrypt refresh_token
        if (result.refresh_token) {
            result.refresh_token = encrypt(result.refresh_token);
        }

        // send response
        return {
            statusCode: response.statusCode,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(result)
        };
    } catch (error) {
        if (error.response) {
            return {
                statusCode: error.response.statusCode,
                body: ''
            };
        } else {
            return { statusCode: 500, body: '' };
        }
    }
};
