import nodemailer from "nodemailer";
import { generateToken } from "../../utils/serverutils.js";
import { getPrismaInstance } from "../../utils/prisma/prisma.js";

// Create reusable transporter with better configuration
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.MAILER_USER,
    pass: process.env.MAILER_PASSKEY,
  },
  pool: true,
  maxConnections: 5,
  maxMessages: 100,
  rateLimit: true,
});

// Verify transporter configuration on startup
transporter.verify((error, success) => {
  if (error) {
    console.error("Email transporter error:", error);
  } else {
    console.log("Email transporter ready to send messages");
  }
});

export const EmailHelper = () => {
  /**
   * Generate email template (ESBOX style)
   */
  const generateEmailTemplate = (rawToken, emailType, username = "") => {
    let endpoint, title, description, buttonText, footerText;

    if (emailType === "password_reset") {
      endpoint = `${process.env.FRONTEND_URL}/reset-password`;
      title = "Reset your password";
      description = "Click the button below to reset your password.";
      buttonText = "Reset password";
      footerText =
        "If you didn't request a password reset, you can safely ignore this email.";
    } else {
      // email_verification
      endpoint = `${process.env.FRONTEND_URL}/verify-email`;
      title = "Verify your email address";
      description = username
        ? `Hi ${username}, please click the button below to verify your email address.`
        : "Please click the button below to verify your email address.";
      buttonText = "Verify email";
      footerText =
        "If you didn't create an account, you can safely ignore this email.";
    }

    // Personalize greeting if username provided for email verification
    const greeting =
      username && emailType === "email_verification" ? `Hi ${username},` : "";

    const htmlBody = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${title} | TuneMate</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f5f5f5;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f5f5; padding: 40px 20px;">
              
                  <td align="center">
                      <table width="100%" max-width="400" cellpadding="0" cellspacing="0" border="0" style="max-width: 400px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                          <!-- Content -->
                          <tr>
                              <td style="padding: 40px 32px 32px 32px;">
                                  ${greeting ? `<p style="color: #4a4a4a; font-size: 14px; margin: 0 0 8px 0;">${greeting}</p>` : ""}
                                  <h2 style="color: #1a1a1a; font-size: 20px; font-weight: 600; margin: 0 0 8px 0;">${title}</h2>
                                  <p style="color: #4a4a4a; font-size: 14px; line-height: 20px; margin: 0 0 32px 0;">${description} This link will expire in 60 minutes.</p>
                                  
                                  <!-- Button -->
                                  <a href="${endpoint}?token=${rawToken}" style="display: inline-block; background-color: #000000; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 500; padding: 12px 24px; border-radius: 6px;">${buttonText}</a>
                              </td>
                          </tr>
                          
                          <!-- Footer -->
                          <tr>
                              <td style="padding: 24px 32px 32px 32px; border-top: 1px solid #eaeaea;">
                                  <p style="color: #888888; font-size: 12px; line-height: 16px; margin: 0;">
                                      ${footerText}<br>
                                      © 2026 TuneMate
                                  </p>
                              </td>
                          </tr>
                      </table>
                  </td>
              </tr>
          </table>
      </body>
      </html>
    `;

    return htmlBody;
  };

  return {
    /**
     * Send email verification link
     * @param {string} email - User's email address
     * @param {string} username - User's username (optional)
     * @returns {Promise<boolean>} Success status
     */
    async sendVerificationMail(email, username = "") {
      try {
        if (!email) {
          console.error("Email is required for verification");
          return false;
        }

        const token = generateToken();
        const prisma = await getPrismaInstance();

        const user = await prisma.User.findUnique({
          where: { email },
        });

        if (!user) {
          console.error(`User with email ${email} not found`);
          return false;
        }

        await prisma.User.update({
          where: { email },
          data: {
            verificationToken: token,
            verificationTokenExpiry: new Date(Date.now() + 3600 * 1000),
          },
        });

        const mailOptions = {
          from: `"TuneMate" <${process.env.MAILER_USER}>`,
          to: email,
          subject: "Verify Your Email - TuneMate",
          html: generateEmailTemplate(
            token,
            "email_verification",
            username || user.username,
          ),
          headers: {
            "X-Priority": "1",
            "X-MSMail-Priority": "High",
            Importance: "high",
          },
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`Verification email sent to ${email}: ${info.messageId}`);
        return true;
      } catch (error) {
        console.error("Error in sendVerificationMail:", error.message);
        return false;
      }
    },

    /**
     * Send password reset email
     * @param {string} email - User's email address
     * @param {string} username - User's username (optional)
     * @returns {Promise<boolean>} Success status
     */
    async sendResetPasswordMail(email, username = "") {
      try {
        if (!email) {
          console.error("Email is required for password reset");
          return false;
        }

        const token = generateToken();
        const prisma = await getPrismaInstance();

        const user = await prisma.User.findUnique({
          where: { email },
        });

        if (!user) {
          console.error(`User with email ${email} not found`);
          return false;
        }

        await prisma.User.update({
          where: { email },
          data: {
            resetToken: token,
            resetTokenExpiry: new Date(Date.now() + 3600 * 1000),
          },
        });

        const mailOptions = {
          from: `"TuneMate" <${process.env.MAILER_USER}>`,
          to: email,
          subject: "Reset Your Password - TuneMate",
          html: generateEmailTemplate(
            token,
            "password_reset",
            username || user.username,
          ),
          headers: {
            "X-Priority": "1",
            "X-MSMail-Priority": "High",
            Importance: "high",
          },
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`Password reset email sent to ${email}: ${info.messageId}`);
        return true;
      } catch (error) {
        console.error("Error in sendResetPasswordMail:", error.message);
        return false;
      }
    },
  };
};
