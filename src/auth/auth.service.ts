import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { MailService } from 'src/mail/mail.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserService } from 'src/user/user.service';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  async getToken(userId: number) {
    const { email, photo, id, person } = await this.userService.get(userId);
    const { name } = person;

    return this.jwtService.sign({ name, email, photo, id });
  }

  async login({ email, password }: { email: string; password: string }) {
    const user = await this.userService.getByEmail(email);

    await this.userService.checkPassword(user.id, password);

    const token = await this.getToken(user.id);

    return {
      token,
    };
  }

  async decodeToken(token: string) {
    try {
      await this.jwtService.verify(token);
    } catch (err) {
      throw new UnauthorizedException(err.message);
    }

    return this.jwtService.decode(token);
  }

  async recovery(email: string) {
    const { id, person } = await this.userService.getByEmail(email);
    const { name } = person;
    const token = await this.jwtService.sign({ id }, { expiresIn: 30 * 60 });

    await this.prisma.passwordRecovery.create({
      data: {
        userId: id,
        token,
      },
    });

    await this.mailService.send({
      to: email,
      subject: 'Esqueci a senha',
      template: 'forget',
      data: {
        name,
        url: `https://website.com.br/auth.html?token=${token}`,
      },
    });

    return { success: true };
  }

  async reset({ password, token }: { password: string; token: string }) {
    if (!password) {
      throw new BadRequestException('Password is required');
    }

    try {
      this.jwtService.verify(token);
    } catch (err) {
      throw new BadRequestException(err.message);
    }

    const passwordRecovery = await this.prisma.passwordRecovery.findFirst({
      where: {
        token,
        resetAt: null,
      },
    });

    if (!passwordRecovery) {
      throw new BadRequestException('Token used');
    }

    await this.prisma.passwordRecovery.update({
      where: {
        id: passwordRecovery.id,
      },
      data: {
        resetAt: new Date(),
      },
    });

    return this.userService.updatePassword(passwordRecovery.userId, password);
  }
}
