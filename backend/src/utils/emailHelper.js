import axios from "axios";

const sendEmail = async (options) => {
  const brevoUrl = "https://api.brevo.com/v3/smtp/email";

  const data = {
    sender: {
      name: process.env.FROM_NAME || "ShopEasy Support",
      email: process.env.FROM_EMAIL, // Must match your verified Brevo sender email
    },
    to: [
      {
        email: options.email,
        name: options.email,
      },
    ],
    subject: options.subject,
    // ✅ FIX: Pass the HTML directly (since your controller provides a full template)
    htmlContent: options.message,
    // ✅ FIX: Use a clean fallback for plain-text clients (avoids showing raw HTML tags)
    textContent: `You have a new notification from ShopEasy: ${options.subject}. Please view this email in an HTML-compatible client.`,
  };

  const config = {
    headers: {
      "api-key": process.env.BREVO_API_KEY,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  };

  try {
    const response = await axios.post(brevoUrl, data, config);
    console.log(`✅ Email sent to ${options.email}. Msg ID: ${response.data.messageId}`);
    return response.data;
  } catch (error) {
    console.error(
      "❌ BREVO EMAIL ERROR:",
      error.response ? error.response.data : error.message
    );
    // We throw to let the controller know, but the controller catches it so the order doesn't fail.
    throw new Error("Email could not be sent");
  }
};

export default sendEmail;
