require("dotenv").config();
const nodemailer = require("nodemailer");
const { google } = require("googleapis");

const user = process.env.GOOGLE_USER;
const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

const oauth2Client = new google.auth.OAuth2(
  clientId,
  clientSecret,
  "https://developers.google.com/oauthplayground",
);
oauth2Client.setCredentials({ refresh_token: refreshToken });

async function createTransporter() {
  const { token: accessToken } = await oauth2Client.getAccessToken();
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: user,
      clientId: clientId,
      clientSecret: clientSecret,
      refreshToken: refreshToken,
      accessToken: accessToken,
    },
  });

  return transporter;
}
// Function to send email
const sendEmail = async (to, subject, text, html) => {
  try {
    const transporter = await createTransporter();
    const info = await transporter.sendMail({
      from: `"Whisper Draw "<${user}>`, // sender address
      to, // list of receivers
      subject, // Subject line
      text, // plain text body
      html, // html body
    });
    //console.log('Message sent: %s', info.messageId);
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};

module.exports = sendEmail;
