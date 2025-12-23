import axios from "axios";

const sendEmail = async (options) => {
  const brevoUrl = "https://api.brevo.com/v3/smtp/email";

  const data = {
    sender: {
      name: process.env.FROM_NAME || "ShopEasy Support",
      email: process.env.FROM_EMAIL, // MUST match your Brevo login email
    },
    to: [
      {
        email: options.email,
        name: options.email,
      },
    ],
    subject: options.subject,
    htmlContent: `<p>${options.message.replace(/\n/g, "<br>")}</p>`, // HTML version
    textContent: options.message, // Plain text fallback
  };

  const config = {
    headers: {
      "api-key": process.env.BREVO_API_KEY, // We will add this to Render next
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  };

  try {
    const response = await axios.post(brevoUrl, data, config);
    console.log("✅ Email sent via Brevo! ID:", response.data.messageId);
    return response.data;
  } catch (error) {
    console.error(
      "❌ BREVO ERROR:",
      error.response ? error.response.data : error.message
    );
    throw new Error("Email could not be sent");
  }
};

export default sendEmail;
