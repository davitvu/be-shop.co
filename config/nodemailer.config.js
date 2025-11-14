// nodemailer.config.js
const { google } = require('googleapis');
const nodemailer = require('nodemailer');

const {
    EMAIL_USER,
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI,
    MAIL_REFRESH_TOKEN
} = process.env;

const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
oAuth2Client.setCredentials({ refresh_token: MAIL_REFRESH_TOKEN });

const createTransport = async () => {
    const accessToken = await oAuth2Client.getAccessToken();

    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            type: 'OAuth2',
            user: EMAIL_USER,
            clientId: CLIENT_ID,
            clientSecret: CLIENT_SECRET,
            refreshToken: MAIL_REFRESH_TOKEN,
            accessToken: accessToken.token,
        },
    });
};

module.exports = createTransport;

