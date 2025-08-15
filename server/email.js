const nodemailer = require('nodemailer');

// Email configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

// Function to send certificate via email
async function sendCertificateEmail(to, studentName, certificateBuffer) {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: to,
        subject: 'Your Certificate',
        text: `Dear ${studentName},\n\nPlease find your certificate attached.\n\nBest regards,\nCertificate Generator Team`,
        attachments: [{
            filename: `${studentName}_certificate.pdf`,
            content: certificateBuffer
        }]
    };

    try {
        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Email sending failed:', error);
        return false;
    }
}
