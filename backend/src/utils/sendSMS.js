// You can integrate Twilio or Fast2SMS here later
const sendSMS = async ({ phone, message }) => {
  // 1. DEVELOPMENT MODE: Log to console
  console.log("=======================================");
  console.log(`📲 SENDING SMS TO: ${phone}`);
  console.log(`💬 MESSAGE: ${message}`);
  console.log("=======================================");

  // 2. PRODUCTION MODE (Example with Twilio - Uncomment when ready)
  /*
  const client = require('twilio')(accountSid, authToken);
  await client.messages.create({
     body: message,
     from: '+1234567890',
     to: phone
  });
  */
};

export default sendSMS;
