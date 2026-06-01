require('dotenv').config();
const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

let twilioClient = null;
if (accountSid && authToken) {
  twilioClient = twilio(accountSid, authToken);
}

/**
 * Sends a fanned-out SMS to the hardcoded demo numbers
 * @param {string} subject - Alert subject/title
 * @param {string} text - Plain text body
 */
async function sendFanOutEmail(subject, text) {
  // We keep the function name `sendFanOutEmail` to avoid breaking existing imports, 
  // but it now acts as an SMS dispatcher.
  const phoneNumbers = [process.env.DEMO_PHONE_1, process.env.DEMO_PHONE_2].filter(Boolean);

  if (phoneNumbers.length === 0) {
    console.warn("⚠️ No DEMO_PHONE numbers found in .env. SMS dispatch skipped.");
    return;
  }

  if (!twilioClient) {
    console.warn("⚠️ Twilio credentials missing in .env. SMS dispatch skipped.");
    return;
  }

  try {
    // Truncate text if it's too long
    const messageBody = `${subject}\n\n${text}`.substring(0, 1500); 

    const promises = phoneNumbers.map(phone => {
      // Ensure we use the whatsapp: prefix for the sandbox
      const toStr = phone.startsWith('whatsapp:') ? phone : `whatsapp:${phone}`;
      const fromStr = twilioPhoneNumber.startsWith('whatsapp:') ? twilioPhoneNumber : `whatsapp:${twilioPhoneNumber}`;

      return twilioClient.messages.create({
        body: messageBody,
        from: fromStr,
        to: toStr
      });
    });

    const results = await Promise.all(promises);
    
    console.log(`📱 WhatsApp messages successfully sent to: ${phoneNumbers.join(', ')}`);
    results.forEach(res => console.log(`📱 Message SID: ${res.sid}`));
    
    return results;
  } catch (error) {
    console.error("❌ Failed to send WhatsApp message via Twilio:", error);
    // Don't throw, just swallow the error so it doesn't crash the server
  }
}

module.exports = {
  sendFanOutEmail
};
