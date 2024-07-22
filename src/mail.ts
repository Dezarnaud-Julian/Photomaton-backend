import * as nodemailer from 'nodemailer';
import { Attachment } from 'nodemailer/lib/mailer';

interface ISendMail {
  to: string;
  subject: string;
  message: string;
  attachments?: Attachment[];
}

export class MailService {
  async send({ to, subject, message, attachments }: ISendMail): Promise<boolean> {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.GOOGLE_MAIL_APP_EMAIL,
        pass: process.env.GOOGLE_MAIL_APP_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.GOOGLE_MAIL_APP_EMAIL,
      to,
      subject,
      html: message,
      attachments,
    };

    try {
      await transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }
}