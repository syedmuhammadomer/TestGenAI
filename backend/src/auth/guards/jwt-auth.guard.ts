import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

export interface AuthenticatedRequest {
  user?: { id: number; email: string; role: 'admin' | 'member' };
  headers: Record<string, string | string[] | undefined>;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authHeader = request.headers.authorization;
    const token = typeof authHeader === 'string' ? authHeader.replace('Bearer ', '') : undefined;

    if (!token) {
      throw new UnauthorizedException('Missing authentication token');
    }

    try {
      const payload = jwt.verify(token, this.JWT_SECRET) as { id: number; email: string; role: 'admin' | 'member' };
      request.user = { id: payload.id, email: payload.email, role: payload.role };
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
