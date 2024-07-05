import {
  ExecutionContext,
  Inject,
  Injectable,
  Logger,
  LoggerService,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { PUBLIC_KEY } from 'src/common/decorator/public.decorator';
import { IS_ROLES_KEY } from 'src/common/decorator/roles.decorator';
import { Role } from 'src/user/enum/role.enum';
import { UserService } from 'src/user/user.service';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    @Inject(Logger) private readonly logger: LoggerService,
    private readonly configService: ConfigService,
  ) {
    super();
  }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    try {
      const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);

      if (isPublic) {
        return true;
      }

      const http = context.switchToHttp();
      const request = http.getRequest<Request>();
      const { url, headers } = request;
      const token = /Bearer\s(.+)/.exec(headers['authorization'])?.[1];
      console.log('headers', headers);
      console.log('token', token);
      if (!token) throw new UnauthorizedException('accessToken is required');

      const key = this.configService.get('jwt');
      const decoded = this.jwtService.verify(token, key);
      console.log('decoded', decoded);
      request['user'] = decoded;

      if (url !== '/api/auth/refresh' && decoded?.['tokenType'] === 'refresh') {
        const error = new UnauthorizedException('accessToken is required');
        this.logger.error(error.message, error.stack);
        throw error;
      }

      const isAdmin = this.reflector.getAllAndOverride<Role[]>(IS_ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);

      if (isAdmin) {
        const userId = decoded['sub'];
        return this.userService.checkAdminUser(userId);
      }

      // return super.canActivate(context);
    } catch (err) {
      this.logger.error('Invalid access token: ' + err.message);
      throw new UnauthorizedException('Invalid access token');
    }

    return super.canActivate(context);
  }
}
