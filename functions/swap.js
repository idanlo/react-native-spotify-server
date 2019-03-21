import {
    spClientCallback,
    postRequest,
    encrypt,
    spotifyEndpoint
} from '../utils';

exports.handler = async (event, context) => {
    try {
        // build request data
        const body = JSON.parse(
            '{"' +
                decodeURI(event.body)
                    .replace(/"/g, '\\"')
                    .replace(/&/g, '","')
                    .replace(/=/g, '":"') +
                '"}'
        );
        const reqData = {
            grant_type: 'authorization_code',
            redirect_uri: spClientCallback,
            code: body.code
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
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(result)
        };
    } catch (error) {
        if (error.response) {
            return {
                statusCode: error.response.statusCode
            };
        } else {
            return { statusCode: 500 };
        }
    }
};
