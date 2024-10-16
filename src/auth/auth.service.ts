import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async signup(email: string, password: string, name: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: {
          email,
        },
        select: {
          email: true,
        },
      });
      if (user) throw new BadRequestException();

      const saltRounds = 10;
      const hash = await bcrypt.hash(password, saltRounds);

      const createUser = await this.prisma.user.create({
        data: {
          email,
          password: hash,
          name,
        },
      });
      const accessToken = this.generateAccessToken(createUser.id);
      const refreshToken = this.generateRefreshToken(createUser.id);

      await this.prisma.refreshToken.create({
        data: {
          token: refreshToken,
          user: { connect: { id: createUser.id } },
        },
      });

      return {
        id: createUser.id,
        accessToken,
        refreshToken,
      };
    } catch (err) {
      console.error(err);
    }
  }

  private generateAccessToken(userId: string) {
    const payload = { sub: userId, tokenType: 'access' };
    return this.jwtService.sign(payload, { expiresIn: '1d' });
  }

  private generateRefreshToken(userId: string) {
    const payload = { sub: userId, tokenType: 'refresh' };
    return this.jwtService.sign(payload, { expiresIn: '30d' });
  }

  async refresh(userId: string, token: string) {
    const refreshTokenEntity = await this.prisma.refreshToken.findUnique({
      where: { token },
    });
    if (!refreshTokenEntity) throw new BadRequestException('refreshToken only');
    const accessToken = this.generateAccessToken(userId);
    const refreshToken = this.generateRefreshToken(userId);
    if (refreshTokenEntity) {
      refreshTokenEntity.token = refreshToken;
    }

    return { id: userId, accessToken, refreshToken };
  }

  private async createRefreshtoken(userId: string, refreshToken: string) {
    let refresh = await this.prisma.refreshToken.findUnique({
      where: {
        refreshTokenId: userId,
      },
    });

    if (refresh) {
      refresh = await this.prisma.refreshToken.update({
        where: {
          refreshTokenId: userId,
        },
        data: {
          token: refreshToken,
        },
      });
    } else {
      refresh = await this.prisma.refreshToken.create({
        data: {
          refreshTokenId: userId,
          token: refreshToken,
        },
      });
    }
  }

  private async validateUser(email: string, password: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    if (!user) throw new UnauthorizedException();

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new UnauthorizedException();

    return user;
  }

  async signin(email: string, password: string) {
    const user = await this.validateUser(email, password);
    const accessToken = this.generateAccessToken(user.id);
    const refreshToken = this.generateRefreshToken(user.id);

    await this.createRefreshtoken(user.id, refreshToken);
    return { id: user.id, accessToken, refreshToken };
  }
}
