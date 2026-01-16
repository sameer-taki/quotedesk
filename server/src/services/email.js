import nodemailer from 'nodemailer';
import config from '../config/env.js';
import { Setting } from '../models/index.js';

/**
 * Get email transporter with latest DB settings
 */
const getTransporter = async () => {
  try {
    const host = await Setting.getValue('smtp_host');
    const port = await Setting.getValue('smtp_port');
    const user = await Setting.getValue('smtp_user');
    const pass = await Setting.getValue('smtp_pass');
    const fromEmail = await Setting.getValue('smtp_from_email');

    if (host && port && user && pass) {
      return {
        transporter: nodemailer.createTransport({
          host,
          port: parseInt(port, 10),
          secure: parseInt(port, 10) === 465,
          auth: { user, pass },
        }),
        from: fromEmail || `${user}`
      };
    }
  } catch (error) {
    console.error('Failed to get SMTP settings from DB:', error);
  }

  // Fallback to environment config or dev logger
  if (config.smtp?.host) {
    return {
      transporter: nodemailer.createTransport({
        host: config.smtp.host,
        port: config.smtp.port,
        secure: config.smtp.port === 465,
        auth: { user: config.smtp.user, pass: config.smtp.pass },
      }),
      from: config.smtp.from || 'Quote Desk <noreply@kastel.local>'
    };
  }

  return {
    transporter: {
      sendMail: async (options) => {
        console.log('\n📧 Email would be sent (Dev Mode):');
        console.log('   To:', options.to);
        console.log('   Subject:', options.subject);
        console.log('   Body:', options.text || options.html?.substring(0, 200) + '...');
        return { messageId: 'dev-' + Date.now() };
      },
    },
    from: 'Quote Desk <noreply@kastel.local>'
  };
};

/**
 * Common send help function
 */
const sendMail = async ({ to, subject, html, text }) => {
  try {
    const { transporter, from } = await getTransporter();
    await transporter.sendMail({
      from,
      to,
      subject,
      html,
      text
    });
    console.log(`✉️ Email "${subject}" sent to ${to}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send email "${subject}" to ${to}:`, error);
    return false;
  }
};

/**
 * Send email notification when quote is approved
 */
export const sendQuoteApprovedEmail = async (quote, creator) => {
  const subject = `Quote ${quote.quoteNumber} has been approved`;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a202c;">
        <h2 style="color: #2b6cb0;">Quote Approved ✓</h2>
        <p>Dear ${creator.name},</p>
        <p>Your quote <strong>${quote.quoteNumber}</strong> for <strong>${quote.clientName}</strong> has been approved.</p>
        <p>Total: <strong>FJD ${parseFloat(quote.totalSellingIncVat).toFixed(2)}</strong></p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 12px; color: #718096;">This is an automated notification from Quote Desk.</p>
    </div>`;

  return sendMail({ to: creator.email, subject, html });
};

/**
 * Send email notification when quote is rejected
 */
export const sendQuoteRejectedEmail = async (quote, creator) => {
  const subject = `Revision Required: Quote ${quote.quoteNumber}`;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a202c;">
        <h2 style="color: #c53030;">Revision Required</h2>
        <p>Dear ${creator.name},</p>
        <p>Your quote <strong>${quote.quoteNumber}</strong> has been returned for revision.</p>
        ${quote.approverComments ? `<p><strong>Comments:</strong> <em>${quote.approverComments}</em></p>` : ''}
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 12px; color: #718096;">This is an automated notification from Quote Desk.</p>
    </div>`;

  return sendMail({ to: creator.email, subject, html });
};

/**
 * Send user invitation email
 */
export const sendInvitationEmail = async (user, setupLink) => {
  const subject = `You've been invited to join Quote Desk`;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a202c;">
        <h2 style="color: #2b6cb0;">Welcome to Quote Desk</h2>
        <p>Hello ${user.name},</p>
        <p>You have been invited to join the team on Quote Desk as a <strong>${user.role}</strong>.</p>
        <p>Please click the button below to set up your password and activate your account:</p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="${setupLink}" style="background: #3182ce; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Set Up Password</a>
        </div>
        <p style="font-size: 13px; color: #718096;">This link will expire in 24 hours.</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 12px; color: #718096;">If you didn't expect this invitation, you can safely ignore this email.</p>
    </div>`;

  const text = `Welcome to Quote Desk! You've been invited as a ${user.role}. Setup your password here: ${setupLink}`;

  return sendMail({ to: user.email, subject, html, text });
};

export default {
  sendQuoteApprovedEmail,
  sendQuoteRejectedEmail,
  sendInvitationEmail
};
