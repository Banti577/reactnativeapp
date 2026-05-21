const express = require('express');
const router = express.Router();


router.post('/send-chat-message', async (req, res) => {
  try {

    const { phoneNumber, message } = req.body;

    const response = await sendSMS(phoneNumber, message);

    res.json({
      success: true,
      sid: response.sid
    });
const { sendSMS } = require('../services/twilioSmsService');
  } catch (error) {

    console.log(error);

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;