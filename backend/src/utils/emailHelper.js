import nodemailer from "nodemailer";

const sendEmail = async (options) => {
  // 1. Create Transporter with explicit Render-friendly settings
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com", // Explicit host
    port: 465, // Secure port (better for Render)
    secure: true, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // MUST be an App Password
    },
  });

  // 2. Debug: Check if Env Vars are loaded (Do not log the actual password)
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error(
      "FATAL ERROR: Email credentials missing in Render Environment Variables."
    );
    throw new Error("Email credentials missing");
  }

  const message = {
    from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
  };

  // 3. Send and Log result
  try {
    const info = await transporter.sendMail(message);
    console.log("Email sent successfully: ", info.messageId);
  } catch (error) {
    console.error("NODEMAILER ERROR:", error); // This will show in Render Logs
    throw error; // Re-throw so your controller knows it failed
  }
};

export default sendEmail;
