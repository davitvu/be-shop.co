const axios = require('axios');
const { OAuth2Client } = require('google-auth-library');

const GOOGLE_AUTH_BASE_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const getGoogleAuthURL = () => {
    const options = {
        client_id: process.env.GOOGLE_CLIENT_ID,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI,
        response_type: 'code',
        access_type: 'offline',
        prompt: 'consent',
        scope: [
            'openid',
            'email',
            'profile',
        ].join(' '),
    };

    const query = new URLSearchParams(options).toString();
    return `${GOOGLE_AUTH_BASE_URL}?${query}`;
};

const getGoogleTokens = async (code) => {
    const values = {
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI,
        grant_type: 'authorization_code',
    };

    const res = await axios.post(
        GOOGLE_TOKEN_URL,
        new URLSearchParams(values).toString(),
        {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        }
    );

    return res.data;
};

const verifyGoogleIdToken = async (idToken) => {
    const ticket = await client.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    if (!payload) throw new Error('Invalid Google ID token payload');

    return {
        sub: payload.sub,
        email: payload.email,
        email_verified: payload.email_verified,
        name: payload.name,
        picture: payload.picture
    };
};

module.exports = {
    getGoogleAuthURL,
    getGoogleTokens,
    verifyGoogleIdToken,
};