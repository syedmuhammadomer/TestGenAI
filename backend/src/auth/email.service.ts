import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;
  private readonly frontendUrl: string;

  constructor() {
    this.frontendUrl = this.resolveFrontendUrl();
    console.log(`[EMAIL] Frontend URL resolved to: ${this.frontendUrl}`);

    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (!smtpUser || !smtpPass) {
      console.warn('[EMAIL] SMTP_USER or SMTP_PASS not set — email sending will be skipped');
    }

    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: { user: smtpUser, pass: smtpPass },
    });

    if (smtpUser && smtpPass) {
      this.transporter.verify((error, _success) => {
        if (error) {
          console.error('[EMAIL] SMTP connection failed:', error.message);
        } else {
          console.log('[EMAIL] SMTP connection verified successfully');
        }
      });
    }
  }

  async sendOtpEmail(email: string, otp: string): Promise<void> {
    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: 'Your OTP Code - Project Authentication',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Welcome to Project!</h2>
          <p>Your One-Time Password (OTP) for account verification is:</p>
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #007bff; font-size: 32px; margin: 0; letter-spacing: 5px;">${otp}</h1>
          </div>
          <p><strong>Important:</strong></p>
          <ul>
            <li>This OTP will expire in 10 minutes</li>
            <li>Do not share this code with anyone</li>
            <li>If you didn't request this, please ignore this email</li>
          </ul>
          <p>Thank you for registering with us!</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
      `,
      text: `
        Welcome to Project!

        Your One-Time Password (OTP) for account verification is: ${otp}

        Important:
        - This OTP will expire in 10 minutes
        - Do not share this code with anyone
        - If you didn't request this, please ignore this email

        Thank you for registering with us!

        This is an automated message. Please do not reply to this email.
      `,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log(`[EMAIL] ✅ OTP sent successfully to ${email}`);
      console.log(`[EMAIL] Message ID: ${info.messageId}`);
      console.log(`[DEV] OTP for ${email}: ${otp}`);
    } catch (error) {
      const err = error as { message?: string; code?: string; response?: string };
      console.error(`[EMAIL] ❌ Failed to send OTP to ${email}`);
      console.error(`[EMAIL] Error Details:`, err.message);
      console.error(`[EMAIL] Error Code:`, err.code);
      if (err.response) {
        console.error(`[EMAIL] SMTP Response:`, err.response);
      }
      // For development, still log the OTP to console as fallback
      console.log(`[DEV] OTP for ${email}: ${otp} (Use this OTP for testing)`);
      throw new Error(`Failed to send OTP email: ${err.message}`);
    }
  }

  async sendWelcomeEmail(email: string, name?: string): Promise<void> {
    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: 'Welcome to Project!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Welcome ${name || 'User'}!</h2>
          <p>Your account has been successfully verified and activated.</p>
          <p>You can now log in to your account and start using all the features of Project.</p>
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center; margin: 20px 0;">
            <a href="${this.frontendUrl}/login"
               style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Login to Your Account
            </a>
          </div>
          <p>If you have any questions, feel free to contact our support team.</p>
          <p>Happy exploring!</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
      `,
      text: `
        Welcome ${name || 'User'}!

        Your account has been successfully verified and activated.

        You can now log in to your account and start using all the features of Project.

        Login here: ${this.frontendUrl}/login

        If you have any questions, feel free to contact our support team.

        Happy exploring!

        This is an automated message. Please do not reply to this email.
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`[EMAIL] Welcome email sent successfully to ${email}`);
    } catch (error) {
      console.error(`[EMAIL] Failed to send welcome email to ${email}:`, error);
    }
  }

  async sendTeamInviteEmail(params: {
    email: string;
    fullName: string;
    role: string;
    project?: string;
    team: string;
  }): Promise<void> {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn(`[EMAIL] Skipping invite email to ${params.email} — SMTP_USER/SMTP_PASS not configured`);
      return;
    }
    const inviteUrl = `${this.frontendUrl}/register?email=${encodeURIComponent(params.email)}`;
    console.log(`[EMAIL] Invite URL: ${inviteUrl}`);
    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: params.email,
      subject: `You're invited to TestGen AI as ${params.role}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">You're invited to join TestGen AI</h2>
          <p>Hello ${params.fullName},</p>
          <p>You have been invited to join the workspace as <strong>${params.role}</strong>.</p>
          <ul>
            <li><strong>Team:</strong> ${params.team}</li>
            <li><strong>Assigned Project:</strong> ${params.project || 'Will be assigned after login'}</li>
          </ul>
          <div style="margin: 24px 0;">
            <a href="${inviteUrl}" style="background-color: #06b6d4; color: white; padding: 12px 20px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Accept Invitation
            </a>
          </div>
          <p>Use this invitation email to register or log in with the same address. Your access will match the assigned role and project.</p>
        </div>
      `,
      text: `You have been invited to TestGen AI as ${params.role}. Team: ${params.team}. Assigned Project: ${params.project || 'Will be assigned after login'}. Accept invitation: ${inviteUrl}`,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`[EMAIL] Team invite sent successfully to ${params.email}`);
    } catch (error) {
      console.error(`[EMAIL] Failed to send invite email to ${params.email}:`, error);
      throw error;
    }
  }

  private resolveFrontendUrl(): string {
    const configuredUrl = process.env.FRONTEND_URL?.trim();
    const fallbackUrl = 'http://localhost:3001';

    return (configuredUrl && configuredUrl.length > 0 ? configuredUrl : fallbackUrl).replace(/\/+$/, '');
  }
}
