import nodemailer from "nodemailer";

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587, // <--- CHANGED: Use 587 instead of 465
    secure: false, // <--- CHANGED: Must be false for port 587
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false, // <--- ADDED: Helps prevent SSL errors on Render
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
    console.log("Email sent successfully: ", info.messageId);
  } catch (error) {
    console.error("NODEMAILER ERROR:", error);
    throw error;
  }
};

export default sendEmail;
