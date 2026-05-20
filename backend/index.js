require('dotenv').config();

const cors = require('cors');
const express = require('express');
const twilio = require('twilio');

const app = express();
const PORT = process.env.PORT || 3000;

const accountSid =
  process.env.TWILIO_ACCOUNT_SID;

const authToken =
  process.env.TWILIO_AUTH_TOKEN;

const apiKey =
  process.env.TWILIO_API_KEY;

const apiSecret =
  process.env.TWILIO_API_SECRET;

const conversationsServiceSid =
  process.env.TWILIO_CONVERSATIONS_SERVICE_SID;

const twimlAppSid =
  process.env.TWIML_APP_SID;



// TWILIO

const client = twilio(accountSid, authToken);

const { AccessToken } = twilio.jwt;
const { ChatGrant } = AccessToken;
const { VoiceGrant } = AccessToken;

// ─────────────────────────────────────────────
// SCOPED SERVICE HELPER
// Always routes through your custom service SID
// ─────────────────────────────────────────────
const svc = () =>
  client.conversations.v1.services(conversationsServiceSid);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// TOKEN

app.get('/voice/token', (req, res) => {
  try {
    const identity = req.query.identity?.trim();

    if (!identity) {
      return res.status(400).json({ error: 'identity required' });
    }

    const token = new AccessToken(accountSid, apiKey, apiSecret, {
      identity,
      ttl: 3600,
    });



    token.addGrant(
      new ChatGrant({
        serviceSid: conversationsServiceSid,
      })
    );

    token.addGrant(
      new VoiceGrant({
        outgoingApplicationSid: twimlAppSid,
        incomingAllow: true,
      })
    );

    return res.json({
      identity,
      token: token.toJwt(),
    });

  } catch (err) {
    console.log('TOKEN ERROR');
    console.log(err);
    return res.status(500).json({ error: err.message });
  }
});


// LIST CONVERSATIONS

app.get('/conversations', async (req, res) => {
  try {
    const conversations = await svc()
      .conversations
      .list({ limit: 50 });

    return res.json({
      conversations: conversations.map(c => ({
        sid: c.sid,
        uniqueName: c.uniqueName,
        friendlyName: c.friendlyName,
      })),
    });

  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: err.message });
  }
});

// RESET — DELETE ALL CONVERSATIONS

app.delete('/reset', async (req, res) => {
  try {
    console.log('RESET called');

    const conversations = await svc()
      .conversations
      .list();

    for (const c of conversations) {
      console.log('DELETING:', c.sid);
      await svc().conversations(c.sid).remove();
    }

    return res.json({ success: true });

  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: err.message });
  }
});


app.post('/send-sms', async (req, res) => {
  try {

    const { to, message } = req.body;


    if (!to || !message) {
      return res.status(400).json({
        success: false,
        error: 'to and message required',
      });
    }


    const response = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: to,
    });

    console.log('SMS SENT:', response.sid);

    return res.json({
      success: true,
      sid: response.sid,
      status: response.status,
    });

  } catch (err) {

    console.log('TWILIO SMS ERROR');
    console.log(err);

    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});


//Incoming msg from user to APP WebHook


app.post('/incoming-sms', (req, res) => {

  console.log('INCOMING SMS');

  console.log('FROM:', req.body.From);

  console.log('MESSAGE:', req.body.Body);

  // Later:
  // save in DB
  // socket emit
  // push notification
  // app sync

  res.sendStatus(200);
});



//incoming call from phone 


app.post(
  '/incoming-phonecall',
  (req, res) => {

    console.log(
      'Incoming phone call'
    );

    const twiml =
      new twilio.twiml.VoiceResponse();

    const dial =
      twiml.dial();

    dial.client('bunty');

    res.type('text/xml');

    res.send(
      twiml.toString()
    );
  }
);


// Create APP to phone call

app.post("/make-call", async (req, res) => {
  try {
    console.log('req body is', req.body)
    const { phoneNumber } = req.body;


    const call = await client.calls.create({
      to: phoneNumber, // user phone number
      from: process.env.TWILIO_PHONE_NUMBER,
      twiml: `
        <Response>
          <Say voice="alice">
            Hello. This call is from your React Native application.
          </Say>
        </Response>
      `,
    });

    console.log('this is call status', call)

    res.json({
      success: true,
      callSid: call.sid,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

//for TwiMl voice route called by  twilio webhook


app.post('/voice', (req, res) => {
  try {
    console.log('VOICE WEBHOOK HIT');

    const VoiceResponse = twilio.twiml.VoiceResponse;

    const response = new VoiceResponse();

    const dial = response.dial({
      callerId: process.env.TWILIO_PHONE_NUMBER,
    });


    console.log('req body is', req.body.To)
    dial.number(req.body.To || req.query.To);



    res.type('text/xml');

    return res.send(response.toString());

  } catch (err) {
    console.log(err);

    return res.status(500).send(err.message);
  }
});



// CREATE / FETCH CONVERSATION

app.post('/conversation', async (req, res) => {
  try {
    const { user1, user2 } = req.body;

    if (!user1 || !user2) {
      return res.status(400).json({ error: 'user1 and user2 required' });
    }

    const uniqueName = [user1, user2].sort().join('__');
    console.log('UNIQUE NAME:', uniqueName);

    let conversation;

    // FETCH EXISTING

    try {
      conversation = await svc()
        .conversations(uniqueName)
        .fetch();

      console.log('EXISTING CONVERSATION:', conversation.sid);

    } catch {

      // ─────────────────────────────────────────
      // CREATE NEW
      // ─────────────────────────────────────────
      console.log('CREATING NEW CONVERSATION');

      conversation = await svc()
        .conversations
        .create({
          uniqueName,
          friendlyName: `Chat ${user1} ${user2}`,
        });

      console.log('CREATED:', conversation.sid);

      // ─────────────────────────────────────────
      // ADD USER 1
      // ─────────────────────────────────────────
      await svc()
        .conversations(conversation.sid)
        .participants
        .create({ identity: user1 });

      console.log('ADDED:', user1);

      // ─────────────────────────────────────────
      // ADD USER 2
      // ─────────────────────────────────────────
      await svc()
        .conversations(conversation.sid)
        .participants
        .create({ identity: user2 });

      console.log('ADDED:', user2);
    }

    // ─────────────────────────────────────────
    // DEBUG PARTICIPANTS
    // ─────────────────────────────────────────
    const participants = await svc()
      .conversations(conversation.sid)
      .participants
      .list();

    console.log('PARTICIPANTS:', participants.map(p => p.identity));

    return res.json({
      conversationSid: conversation.sid,
      uniqueName: conversation.uniqueName,
    });

  } catch (err) {
    console.log('========== ERROR ==========');
    console.log('MESSAGE:  ', err.message);
    console.log('CODE:     ', err.code);
    console.log('STATUS:   ', err.status);
    console.log('MORE INFO:', err.moreInfo);
    console.log(err);

    return res.status(500).json({ error: err.message });
  }
});





app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health: http://0.0.0.0:${PORT}/health`);
});