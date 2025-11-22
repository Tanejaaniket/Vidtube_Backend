// Looking to send emails in production? Check out our Email API/SMTP product!
import nodemailer from "nodemailer";
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  auth: {
    user: process.env.MAILER_USER,
    pass: process.env.MAILER_PASSWORD,
  },
});

async function signupMail(username, email) {
  const info = await transporter.sendMail({
    from: '"VidTube" <vidtube@noreply.email>', // sender address
    to: email, // list of receivers
    subject: "Welcome to Vidtube", // Subject line
    html: `<h3>Hello  ${username}! </h3><p>Thank you for signing up with VidTube. We are excited to have you on board.</p><p>Aniket Taneja</p>
    `, // html body
  });

  console.log("Message sent: %s", info.messageId);
}

async function changePasswordMail(username, email) {
  const info = await transporter.sendMail({
    from: '"VidTube" <vidtube@noreply.email>', // sender address
    to: email, // list of receivers
    subject: "Welcome to Vidtube", // Subject line
    html: `<h3>Hello  ${username}! </h3><p>You have successfully changed your password at VidTube on ${new Date().toDateString()}</p><p>Aniket Taneja</p>
    `, // html body
  });

  console.log("Message sent: %s", info.messageId);
}
async function changeAccountDetailsMail(username, email) {
  const info = await transporter.sendMail({
    from: '"VidTube" <vidtube@noreply.email>', // sender address
    to: email, // list of receivers
    subject: "Welcome to Vidtube", // Subject line
    html: `<h3>Hello  ${username}! </h3><p>You have successfully changed your account details at VidTube on ${new Date().toDateString()}</p><p>Aniket Taneja</p>
    `, // html body
  });

  console.log("Message sent: %s", info.messageId);
}
async function loginMail(username, email) {
  const info = await transporter.sendMail({
    from: '"VidTube" <vidtube@noreply.email>', // sender address
    to: email, // list of receivers
    subject: "Welcome to Vidtube", // Subject line
    html: `<h3>Hello  ${username}! </h3><p>Welcome back to vidtube.Its great to see you again</p><p>Aniket Taneja</p>
    `, // html body
  });

  console.log("Message sent: %s", info.messageId);
}

export { signupMail, loginMail,changePasswordMail,changeAccountDetailsMail };
