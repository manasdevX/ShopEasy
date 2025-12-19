import twilio from "twilio";
import dotenv from "dotenv";

dotenv.config();

const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

const sendSMS = async ({ phone, message }) => {
  try {
    // Ensure phone number has country code (e.g., India +91)
    // You can force add it if your frontend doesn't send it:
    let formattedPhone = phone;
    if (!phone.startsWith("+")) {
      formattedPhone = `+91${phone}`; // Change +91 to your country code
    }

    await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedPhone,
    });

    console.log(`SMS sent successfully to ${formattedPhone}`);
  } catch (error) {
    console.error("SMS Service Failed:", error.message);
    throw new Error("Could not send SMS");
  }
};

export default sendSMS;
