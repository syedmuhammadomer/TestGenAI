import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { User } from './user.entity';
import { PendingRegistration } from './pending-registration.entity';
import { EmailService } from './email.service';
import { ALL_MODULES, DEFAULT_MODULES_BY_ROLE, MemberRole, TeamMember, TeamMemberStatus } from '../team/entities/team-member.entity';

@Injectable()
export class AuthService {
  private readonly JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';
  private readonly OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
  private readonly MAX_OTP_ATTEMPTS = 5;

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(PendingRegistration)
    private pendingRepository: Repository<PendingRegistration>,
    @InjectRepository(TeamMember)
    private teamMemberRepository: Repository<TeamMember>,
    private emailService: EmailService,
  ) {
    this.createDemoUser();
  }

  private async createDemoUser() {
    const existing = await this.userRepository.findOne({ where: { email: 'user@example.com' } });
    if (existing) {
      // Update existing user if they don't have firstName/lastName
      if (!existing.firstName || !existing.lastName) {
        existing.firstName = 'Demo';
        existing.lastName = 'User';
      }
      if (existing.role !== 'admin') {
        existing.role = 'admin';
      }
      await this.userRepository.save(existing);
    } else {
      // Create new demo user as an admin so role management can be tested immediately
      const hash = await bcrypt.hash('password123!', 10);
      const demoUser = this.userRepository.create({
        firstName: 'Demo',
        lastName: 'User',
        email: 'user@example.com',
        passwordHash: hash,
        verified: true,
        role: 'admin',
      });
      await this.userRepository.save(demoUser);
    }
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userRepository.findOne({ where: { email: email.toLowerCase() } });
    if (!user) return null;
    const match = await bcrypt.compare(password, user.passwordHash);
    return match ? user : null;
  }

  /**
   * Register a new user - creates a pending registration and sends OTP
   */
  async register(firstName: string, lastName: string, email: string, password: string): Promise<{ message: string }> {
    // Validate email is not already registered
    const existingUser = await this.userRepository.findOne({ where: { email: email.toLowerCase() } });
    if (existingUser) {
      throw new BadRequestException('Email already registered');
    }

    // Check if there's already a pending registration
    const existingPending = await this.pendingRepository.findOne({ where: { email: email.toLowerCase() } });
    if (existingPending) {
      throw new BadRequestException('Registration already pending. Please verify OTP or try again later');
    }

    // Hash the password
    const passwordHash = await bcrypt.hash(password, 10);

    // Generate 6-digit OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000));

    // Store pending registration
    const pending = this.pendingRepository.create({
      email: email.toLowerCase(),
      firstName,
      lastName,
      passwordHash,
      otp,
      otpExpiry: Date.now() + this.OTP_EXPIRY_MS,
      attempts: 0,
    });

    await this.pendingRepository.save(pending);

    // Send OTP via email service
    try {
      await this.emailService.sendOtpEmail(email, otp);
    } catch (error) {
      // Email delivery failed: don't leave a stale pending registration blocking retries
      await this.pendingRepository.delete({ email: email.toLowerCase() });
      throw new BadRequestException(
        'Failed to send OTP email. Please check the email address and try again later'
      );
    }

    return {
      message: 'Registration submitted. OTP sent to your email',
    };
  }

  /**
   * Register an invited member directly — no OTP required.
   * The invite link itself is the proof of intent.
   */
  async registerInvited(firstName: string, lastName: string, email: string, password: string): Promise<{ token: string; message: string }> {
    const normalizedEmail = email.toLowerCase();

    // Must have a pending invite
    const member = await this.teamMemberRepository.findOne({
      where: { email: normalizedEmail, status: TeamMemberStatus.Invited },
    });
    if (!member) {
      throw new BadRequestException('No pending invitation found for this email address');
    }

    // Must not already be registered
    const existingUser = await this.userRepository.findOne({ where: { email: normalizedEmail } });
    if (existingUser) {
      throw new BadRequestException('An account with this email already exists. Please log in.');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = this.userRepository.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: normalizedEmail,
      passwordHash,
      verified: true,
    });
    await this.userRepository.save(newUser);

    // Mark team member as active
    member.status = TeamMemberStatus.Online;
    await this.teamMemberRepository.save(member);

    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role },
      this.JWT_SECRET,
      { expiresIn: '7d' },
    );

    return { token, message: 'Account created successfully' };
  }

  /**
   * Verify OTP and complete registration
   */
  async verifyOtp(email: string, otp: string): Promise<{ token: string; message: string }> {
    const pending = await this.pendingRepository.findOne({ where: { email: email.toLowerCase() } });

    if (!pending) {
      throw new BadRequestException('No pending registration found. Please register first');
    }

    // Check if OTP has expired
    if (Date.now() > pending.otpExpiry) {
      await this.pendingRepository.delete({ email: email.toLowerCase() });
      throw new BadRequestException('OTP expired. Please register again');
    }

    // Check if max attempts exceeded
    if (pending.attempts >= this.MAX_OTP_ATTEMPTS) {
      await this.pendingRepository.delete({ email: email.toLowerCase() });
      throw new BadRequestException('Too many OTP attempts. Please register again');
    }

    // Verify OTP
    if (otp !== pending.otp) {
      pending.attempts++;
      await this.pendingRepository.save(pending);
      throw new BadRequestException(
        `Invalid OTP. ${this.MAX_OTP_ATTEMPTS - pending.attempts} attempts remaining`
      );
    }

    // Create the user
    const newUser = this.userRepository.create({
      firstName: pending.firstName,
      lastName: pending.lastName,
      email: pending.email,
      passwordHash: pending.passwordHash,
      verified: true,
    });

    await this.userRepository.save(newUser);
    await this.pendingRepository.delete({ email: email.toLowerCase() });

    // Send welcome email
    try {
      await this.emailService.sendWelcomeEmail(newUser.email);
    } catch (error) {
      console.error(`[EMAIL] Failed to send welcome email to ${newUser.email}:`, error);
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role },
      this.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return {
      token,
      message: 'Registration successful',
    };
  }

  /**
   * Resend OTP
   */
  async resendOtp(email: string): Promise<{ message: string }> {
    const pending = await this.pendingRepository.findOne({ where: { email: email.toLowerCase() } });

    if (!pending) {
      throw new BadRequestException('No pending registration found');
    }

    // Generate new OTP
    const newOtp = String(Math.floor(100000 + Math.random() * 900000));

    // Update pending registration
    pending.otp = newOtp;
    pending.otpExpiry = Date.now() + this.OTP_EXPIRY_MS;
    pending.attempts = 0;

    await this.pendingRepository.save(pending);

    // Send OTP via email service
    try {
      await this.emailService.sendOtpEmail(email, newOtp);
    } catch (error) {
      throw new BadRequestException(
        'Failed to send OTP email. Please check the email address and try again later'
      );
    }

    return {
      message: 'OTP resent to your email',
    };
  }

  /**
   * Generate login response with JWT token
   */
  async loginResponse(user: User) {
    const token = jwt.sign(
      { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role },
      this.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return {
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  /**
   * Get the current authenticated user's profile, enriched with team role + module access.
   * - Company admins (user.role === 'admin') always get full access.
   * - Everyone else looks up their TeamMember record by email for role + modules.
   */
  async getMe(userId: number) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Company admin — full access regardless of TeamMember record
    if (user.role === 'admin') {
      return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: MemberRole.CompanyAdmin,
        modules: [...ALL_MODULES],
      };
    }

    // Look up their TeamMember record to get assigned role + modules
    const member = await this.teamMemberRepository.findOne({ where: { email: user.email } });

    // No TeamMember record means this user registered themselves — treat as company owner
    if (!member) {
      return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: MemberRole.CompanyAdmin,
        modules: [...ALL_MODULES],
      };
    }

    const memberRole: MemberRole = member.role ?? MemberRole.Viewer;
    const modules = member.modules?.length
      ? member.modules
      : DEFAULT_MODULES_BY_ROLE[memberRole];

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: memberRole,
      modules,
    };
  }

  /**
   * List all users (admin only) for the permissions management screen
   */
  async listUsers() {
    const users = await this.userRepository.find({ order: { createdAt: 'ASC' } });
    return users.map((user) => ({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      verified: user.verified,
    }));
  }

  /**
   * Update a user's role (admin only). Prevents demoting the last remaining admin.
   */
  async updateUserRole(targetUserId: number, role: 'admin' | 'member') {
    const target = await this.userRepository.findOne({ where: { id: targetUserId } });
    if (!target) {
      throw new BadRequestException('User not found');
    }

    if (target.role === 'admin' && role !== 'admin') {
      const adminCount = await this.userRepository.count({ where: { role: 'admin' } });
      if (adminCount <= 1) {
        throw new BadRequestException('Cannot remove the last remaining admin');
      }
    }

    target.role = role;
    await this.userRepository.save(target);

    return {
      id: target.id,
      firstName: target.firstName,
      lastName: target.lastName,
      email: target.email,
      role: target.role,
      verified: target.verified,
    };
  }
}
