const express = require('express');
const router = express.Router();

const twilioSDK = require('twilio');


const AccessToken =
    twilioSDK.jwt.AccessToken;

const VoiceGrant =
    AccessToken.VoiceGrant;

const accountSid =
    process.env.TWILIO_ACCOUNT_SID;

const apiKey =
    process.env.TWILIO_API_KEY;

const apiSecret =
    process.env.TWILIO_API_SECRET;

const twimlAppSid =
    process.env.TWIML_APP_SID;



module.exports = router;