

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const twilioSDK = require('twilio');

const app = express();

const { AccessToken } = twilioSDK.jwt;
const { VoiceGrant } = AccessToken;

// ── Env vars ──────────────────────────────────────────────────
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const apiKey = process.env.TWILIO_API_KEY;
const apiSecret = process.env.TWILIO_API_SECRET;
const twimlAppSid = process.env.TWIML_APP_SID;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
const pushCredentialSid = process.env.PUSH_CREDENTIAL_SID;  // FCM credential
const PORT = process.env.PORT || 3000;

// ── Middleware ────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ── Helper: check all required env vars ───────────────────────
function checkEnv(required) {
    return required.filter(([, v]) => !v).map(([k]) => k);
}

// ─────────────────────────────────────────────────────────────
// GET /voice/token?identity=alice
//
// React Native app yahan se Twilio Access Token leta hai.
// Is token se:
//   1. voice.register(token, { fcmToken }) — push notifications ke liye
//   2. voice.connect(token, { params })    — outgoing call ke liye
// ─────────────────────────────────────────────────────────────




app.get('/voice/token', (req, res) => {
    const identity = req.query.identity?.trim();

    if (!identity) {
        return res.status(400).json({ error: 'identity is required' });
    }

    // Validate identity — sirf alphanumeric + underscore/hyphen allow karo
    if (!/^[a-zA-Z0-9_\-\.]+$/.test(identity)) {
        return res.status(400).json({ error: 'Invalid identity. Use only letters, numbers, underscore, hyphen.' });
    }

    const missing = checkEnv([
        ['TWILIO_ACCOUNT_SID', accountSid],
        ['TWILIO_API_KEY', apiKey],
        ['TWILIO_API_SECRET', apiSecret],
        ['TWIML_APP_SID', twimlAppSid],
    ]);

    if (missing.length > 0) {
        console.error('❌ Missing env vars:', missing);
        return res.status(500).json({ error: `Missing config: ${missing.join(', ')}` });
    }

    try {
        console.log('✅ Creating token for identity:', identity);

        const token = new AccessToken(accountSid, apiKey, apiSecret, {
            identity,
            ttl: 3600, // 1 hour valid
        });

        // VoiceGrant — incoming + outgoing allow
        const voiceGrant = new VoiceGrant({
            outgoingApplicationSid: twimlAppSid,
            incomingAllow: true,
            // ✅ KEY: Android FCM push ke liye yeh zaroori hai
            // Twilio Console → Voice → Push Credentials mein FCM Server Key add karo
            // wahan se PUSH_CREDENTIAL_SID milega
            ...(pushCredentialSid && { androidPushCredentialSid: pushCredentialSid }),
        });

        token.addGrant(voiceGrant);

        const jwt = token.toJwt();
        console.log('✅ Token generated for:', identity);

        return res.json({ token: jwt, identity });

    } catch (err) {
        console.error('❌ Token generation error:', err.message);
        return res.status(500).json({ error: 'Token generation failed: ' + err.message });
    }
});

// ─────────────────────────────────────────────────────────────
// POST /voice — TwiML webhook
//
// Twilio yahan aata hai jab koi call aati/jati hai.
// TwiML App ke "Voice Request URL" mein yeh URL set karo:
//   https://your-server.com/voice
//
// Agar local development kar rahe ho, ngrok use karo:
//   ngrok http 3000
//   → https://xxxx.ngrok.io/voice
// ─────────────────────────────────────────────────────────────
app.post('/voice', (req, res) => {
    const to = req.body.To || req.query.To;
    const from = req.body.From || req.query.From || 'anonymous';

    console.log('📞 TwiML request — To:', to, '| From:', from);

    const twiml = new twilioSDK.twiml.VoiceResponse();

    if (!to) {
        twiml.say('No destination provided.');
        console.log('⚠️ No To field — saying error message');

    } else if (/^\+?[1-9]\d{7,14}$/.test(to)) {
        // ── PSTN phone number call (e.g. +919876543210) ──────────
        console.log('📱 PSTN call to:', to);

        const callerId = twilioPhoneNumber || from;
        const dial = twiml.dial({
            callerId,
            answerOnBridge: true,  // caller "connected" tab ho jab receiver pick kare
        });
        dial.number(to);

    } else {
        // ── App-to-App (client identity) call ────────────────────
        // "client:bob" ya sirf "bob" dono handle karte hain
        const clientName = to.startsWith('client:') ? to.replace('client:', '') : to;
        console.log('📲 Client call to:', clientName);

        const dial = twiml.dial({
            answerOnBridge: true,  // ✅ receiver ke pickup karne tak caller "ringing" mein rahe
            callerId: from,
        });
        dial.client(clientName);

        console.log('✅ Dialing client:', clientName);
    }

    console.log('📄 TwiML:\n', twiml.toString());

    res.type('text/xml');
    return res.send(twiml.toString());
});

// ─────────────────────────────────────────────────────────────
// GET /voice/status — Call status callback (optional)
// Twilio Console → TwiML App → Status Callback URL mein set karo
// ─────────────────────────────────────────────────────────────
app.post('/voice/status', (req, res) => {
    const { CallSid, CallStatus, To, From, Duration } = req.body;
    console.log(`📊 Call Status — SID: ${CallSid} | Status: ${CallStatus} | To: ${To} | From: ${From} | Duration: ${Duration}s`);
    res.sendStatus(204);
});

// ─────────────────────────────────────────────────────────────
// GET /health — Server health check
// ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        env: {
            accountSid: accountSid ? '✅ set' : '❌ missing',
            apiKey: apiKey ? '✅ set' : '❌ missing',
            apiSecret: apiSecret ? '✅ set' : '❌ missing',
            twimlAppSid: twimlAppSid ? '✅ set' : '❌ missing',
            twilioPhoneNumber: twilioPhoneNumber ? '✅ set' : '⚠️ not set (PSTN calls may fail)',
            pushCredentialSid: pushCredentialSid ? '✅ set' : '⚠️ not set (background push disabled)',
        },
    });
});

// ─────────────────────────────────────────────────────────────
// Start server
// ─────────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 Server running on http://0.0.0.0:${PORT}`);
    console.log(`🔍 Health:  http://0.0.0.0:${PORT}/health`);
    console.log(`🎙️  Token:   http://0.0.0.0:${PORT}/voice/token?identity=alice`);
    console.log(`📞 TwiML:   http://0.0.0.0:${PORT}/voice\n`);

    // Warn about missing optional vars
    if (!pushCredentialSid) {
        console.warn('⚠️  PUSH_CREDENTIAL_SID not set — background incoming calls will NOT work');
        console.warn('→ Twilio Console → Voice → Push Credentials → Create Android credential with FCM Server Key');
    }
    if (!twilioPhoneNumber) {
        console.warn('⚠️  TWILIO_PHONE_NUMBER not set — PSTN outgoing calls may fail');
    }
});