import nodemailer from "nodemailer";

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    service: "gmail", // <--- The "Magic" setting. No host/port needed.
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const message = {
    from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
  };

  try {
    const info = await transporter.sendMail(message);
    console.log("✅ Email sent: ", info.messageId);
  } catch (error) {
    console.error("❌ NODEMAILER ERROR:", error);
    throw error;
  }
};

export default sendEmail;
