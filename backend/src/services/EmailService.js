const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initialize();
  }

  initialize() {
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      this.transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });
    } else {
      console.warn('Email service not configured - emails will not be sent');
    }
  }

  async sendEmail(to, subject, html) {
    if (!this.transporter) {
      console.log('Email skipped (not configured):', subject, 'to', to);
      return;
    }

    try {
      await this.transporter.sendMail({
        from: `"GUTMANN System" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html
      });
    } catch (err) {
      console.error('Email send error:', err);
    }
  }

  async sendProjectStatusEmail(recipientEmail, projectNumber, newStatus) {
    const subject = `Project ${projectNumber} - Status Update`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">GUTMANN Project Update</h2>
        <p>Your project <strong>${projectNumber}</strong> has been updated.</p>
        <p>New Status: <strong style="color: #3498db;">${newStatus.replace(/_/g, ' ').toUpperCase()}</strong></p>
        <p>Please log in to the GUTMANN portal for more details.</p>
        <hr>
        <small style="color: #999;">This is an automated message from GUTMANN Project Workflow System</small>
      </div>
    `;
    await this.sendEmail(recipientEmail, subject, html);
  }

  async sendWelcomeEmail(recipientEmail, name, role) {
    const subject = 'Welcome to GUTMANN Project Workflow System';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">Welcome to GUTMANN!</h2>
        <p>Hello <strong>${name}</strong>,</p>
        <p>Your account has been created with the role: <strong>${role}</strong></p>
        <p>You can now log in to access the project workflow system.</p>
        <hr>
        <small style="color: #999;">GUTMANN Project Workflow System</small>
      </div>
    `;
    await this.sendEmail(recipientEmail, subject, html);
  }
}

module.exports = new EmailService();
