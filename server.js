require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const dns = require('dns');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Multer configuration for file uploads
const storage = multer.memoryStorage(); // Store files in memory for email attachments
const upload = multer({ storage: storage }).fields([
    { name: 'selfPhoto', maxCount: 1 },
    { name: 'photoIdFront', maxCount: 1 },
    { name: 'photoIdBack', maxCount: 1 }
]);

// Transporter configuration
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // use STARTTLS
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    // Force IPv4 and avoid IPv6 connectivity issues
    localAddress: '0.0.0.0',
    lookup: (hostname, options, callback) => dns.lookup(hostname, { family: 4 }, callback),
    tls: {
        family: 4
    }
});

// Verify transporter
transporter.verify((error, success) => {
    if (error) {
        console.log('Transporter verification failed:', error.message);
        console.log('Error details:', error);
    } else {
        console.log('Server is ready to send emails');
    }
});

// Routes
app.post('/api/send-otp', async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.status(400).json({ success: false, message: 'Email and OTP are required.' });
    }

    const mailOptions = {
        from: `"Trinoid Solutions" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Your Verification Code - Trinoid Solutions',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                <h2 style="color: #000; text-align: center;">TRINOID SOLUTIONS</h2>
                <p>Hello,</p>
                <p>You are receiving this email because a verification code was requested for access to the Trinoid Solutions portal.</p>
                <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0; border-radius: 5px;">
                    ${otp}
                </div>
                <p>This code will expire shortly. If you did not request this, please ignore this email.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                <p style="font-size: 12px; color: #888; text-align: center;">
                    © 2026 TRINOID SOLUTIONS. All rights reserved.
                </p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        res.status(200).json({ success: true, message: 'OTP sent successfully!' });
    } catch (error) {
        console.error('Error sending email:', error.message);
        console.error('Error code:', error.code);
        console.error('Error details:', error);

        let errorMessage = 'Failed to send OTP.';
        if (error.code === 'ESOCKET' || error.code === 'ENETUNREACH') {
            errorMessage = 'Network connectivity issue. Please check your internet connection.';
        } else if (error.code === 'EAUTH') {
            errorMessage = 'Email authentication failed. Please check email credentials.';
        } else if (error.code === 'ECONNREFUSED') {
            errorMessage = 'Email server connection refused. Please try again later.';
        }

        res.status(500).json({ success: false, message: errorMessage });
    }
});

app.post('/api/contact', upload, async (req, res) => {
    const { name, email, phone1, phone2, phone3, subject, message } = req.body;
    
    const attachments = [];
    if (req.files) {
        if (req.files.selfPhoto) {
            attachments.push({
                filename: req.files.selfPhoto[0].originalname,
                content: req.files.selfPhoto[0].buffer
            });
        }
        if (req.files.photoIdFront) {
            attachments.push({
                filename: req.files.photoIdFront[0].originalname,
                content: req.files.photoIdFront[0].buffer
            });
        }
        if (req.files.photoIdBack) {
            attachments.push({
                filename: req.files.photoIdBack[0].originalname,
                content: req.files.photoIdBack[0].buffer
            });
        }
    }

    const mailOptions = {
        from: `"Contact Form" <${process.env.EMAIL_USER}>`,
        to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
        subject: `New Contact Inquiry: ${subject}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="border-bottom: 2px solid #333; padding-bottom: 10px;">New Inquiry from Website</h2>
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Phones:</strong> ${phone1}${phone2 ? ', ' + phone2 : ''}${phone3 ? ', ' + phone3 : ''}</p>
                <p><strong>Subject:</strong> ${subject}</p>
                <div style="margin-top: 20px;">
                    <strong>Message:</strong>
                    <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #333; margin-top: 10px; font-style: italic;">
                        ${message}
                    </div>
                </div>
                <p style="margin-top: 20px; font-size: 11px; color: #666;">
                    Attached files: ${attachments.length > 0 ? attachments.map(a => a.filename).join(', ') : 'None'}
                </p>
            </div>
        `,
        attachments: attachments
    };

    try {
        await transporter.sendMail(mailOptions);
        res.status(200).json({ success: true, message: 'Message sent successfully!' });
    } catch (error) {
        console.error('Error sending contact email:', error);
        res.status(500).json({ success: false, message: 'Failed to send message.' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
