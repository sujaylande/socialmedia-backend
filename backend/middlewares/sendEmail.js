import nodeMailer from 'nodemailer';

const sendEmail = async (options) => {
    const transporter = nodeMailer.createTransport({
            host: "sandbox.smtp.mailtrap.io",
            port: 2525,
            auth: {
              user: "5160f0454b0bea",
              pass: "652e6a2c1b6f4e"
            }
    });

    const mailOptions = {
        from: process.env.SMPT_MAIL,
        to: options.email,
        subject: options.subject,
        text: options.message,
    }
    await transporter.sendMail(mailOptions);
};

export default sendEmail;