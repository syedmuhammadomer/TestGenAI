import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto, VerifyOtpDto, ResendOtpDto } from './dto/register.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AuthenticatedRequest, JwtAuthGuard } from './guards/jwt-auth.guard';
import { AdminGuard } from './guards/admin.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'user@example.com' },
        password: { type: 'string', example: 'password123!' }
      },
      required: ['email', 'password']
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Login successful', 
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Login successful' },
        token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            email: { type: 'string', example: 'user@example.com' }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Missing or invalid fields' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() body: LoginDto) {
    const { email, password } = body;

    const user = await this.authService.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('Incorrect email or password');
    }

    return this.authService.loginResponse(user);
  }

  @Post('register')
  @ApiOperation({ summary: 'Register a new user account' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        firstName: { type: 'string', example: 'John' },
        lastName: { type: 'string', example: 'Doe' },
        email: { type: 'string', example: 'newuser@example.com' },
        password: { type: 'string', example: 'SecurePass123!' },
        confirmPassword: { type: 'string', example: 'SecurePass123!' }
      },
      required: ['firstName', 'lastName', 'email', 'password', 'confirmPassword']
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Registration initiated, OTP sent to email', 
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Registration submitted. OTP sent to your email' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid email, password, or email already registered' })
  async register(@Body() body: RegisterDto) {
    const { firstName, lastName, email, password } = body;
    return this.authService.register(firstName, lastName, email, password);
  }

  @Post('register-invited')
  @ApiOperation({ summary: 'Complete registration from a team invite link (no OTP required)' })
  async registerInvited(@Body() body: RegisterDto) {
    const { firstName, lastName, email, password } = body;
    return this.authService.registerInvited(firstName, lastName, email, password);
  }

  @Post('verify-otp')
  @ApiOperation({ summary: 'Verify OTP and complete registration' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'newuser@example.com' },
        otp: { type: 'string', example: '123456' }
      },
      required: ['email', 'otp']
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Registration completed, user authenticated', 
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Registration successful' },
        token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid OTP, expired OTP, or no pending registration' })
  async verifyOtp(@Body() body: VerifyOtpDto) {
    const { email, otp } = body;
    return this.authService.verifyOtp(email, otp);
  }

  @Post('resend-otp')
  @ApiOperation({ summary: 'Resend OTP to email' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'newuser@example.com' }
      },
      required: ['email']
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'OTP resent', 
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'OTP resent to your email' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'No pending registration found' })
  async resendOtp(@Body() body: ResendOtpDto) {
    const { email } = body;
    return this.authService.resendOtp(email);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get the current authenticated user profile' })
  async me(@Req() req: AuthenticatedRequest) {
    return this.authService.getMe(req.user!.id);
  }

  @Patch('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Change the current user password' })
  async changePassword(@Req() req: AuthenticatedRequest, @Body() body: ChangePasswordDto) {
    return this.authService.changePassword(req.user!.id, body.currentPassword, body.newPassword);
  }

  @Get('users')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List all users (admin only)' })
  async listUsers() {
    return this.authService.listUsers();
  }

  @Patch('users/:id/role')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: "Update a user's role (admin only)" })
  async updateUserRole(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateRoleDto) {
    return this.authService.updateUserRole(id, body.role);
  }
}
