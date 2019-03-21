// npm deps
const https = require('https');
const crypto = require('crypto');
const { URL } = require('url');
const QueryString = require('querystring');
require('dotenv').config();

// init spotify config
const spClientId = process.env.SPOTIFY_CLIENT_ID;
const spClientSecret = process.env.SPOTIFY_CLIENT_SECRET;
export const spClientCallback = process.env.SPOTIFY_CLIENT_CALLBACK;
const authString = Buffer.from(spClientId + ':' + spClientSecret).toString(
    'base64'
);
const authHeader = `Basic ${authString}`;
export const spotifyEndpoint = 'https://accounts.spotify.com/api/token';

// encryption
const encSecret = process.env.ENCRYPTION_SECRET;
const encMethod = process.env.ENCRYPTION_METHOD || 'aes-256-ctr';
export const encrypt = text => {
    const aes = crypto.createCipher(encMethod, encSecret);
    let encrypted = aes.update(text, 'utf8', 'hex');
    encrypted += aes.final('hex');
    return encrypted;
};
export const decrypt = text => {
    const aes = crypto.createDecipher(encMethod, encSecret);
    let decrypted = aes.update(text, 'hex', 'utf8');
    decrypted += aes.final('utf8');
    return decrypted;
};

// handle sending POST request
export function postRequest(url, data = {}) {
    return new Promise((resolve, reject) => {
        // build request data
        url = new URL(url);
        const reqData = {
            protocol: url.protocol,
            hostname: url.hostname,
            port: url.port,
            path: url.pathname,
            method: 'POST',
            headers: {
                Authorization: authHeader,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        };

        // create request
        const req = https.request(reqData, res => {
            // build response
            let buffers = [];
            res.on('data', chunk => {
                buffers.push(chunk);
            });

            res.on('end', () => {
                // parse response
                let result = null;
                try {
                    result = Buffer.concat(buffers);
                    result = result.toString();
                    var contentType = res.headers['content-type'];
                    if (typeof contentType == 'string') {
                        contentType = contentType.split(';')[0].trim();
                    }
                    if (contentType == 'application/x-www-form-urlencoded') {
                        result = QueryString.parse(result);
                    } else if (contentType == 'application/json') {
                        result = JSON.parse(result);
                    }
                } catch (error) {
                    error.response = res;
                    error.data = result;
                    reject(error);
                    return;
                }
                resolve({ response: res, result: result });
            });
        });

        // handle error
        req.on('error', error => {
            reject(error);
        });

        // send
        data = QueryString.stringify(data);
        req.write(data);
        req.end();
    });
}
