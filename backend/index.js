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



// TWILIO

const client = twilio(accountSid, authToken);

const { AccessToken } = twilio.jwt;
const { ChatGrant } = AccessToken;

// ─────────────────────────────────────────────
// SCOPED SERVICE HELPER
// Always routes through your custom service SID
// ─────────────────────────────────────────────
const svc = () =>
  client.conversations.v1.services(conversationsServiceSid);

app.use(cors());
app.use(express.json());


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
        sid:          c.sid,
        uniqueName:   c.uniqueName,
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
      uniqueName:      conversation.uniqueName,
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

// ─────────────────────────────────────────────
// START SERVER
// ─────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health: http://0.0.0.0:${PORT}/health`);
});