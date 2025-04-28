// Looking to send emails in production? Check out our Email API/SMTP product!
import nodemailer from "nodemailer";
const transporter = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: "887e662601209e",
    pass: "318c37cade8140",
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
