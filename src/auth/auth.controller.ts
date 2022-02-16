import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Headers,
} from '@nestjs/common';
import { parse } from 'date-fns';
import { UserService } from 'src/user/user.service';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(
    private userService: UserService,
    private authService: AuthService,
  ) {}

  @Post()
  async verifyEmail(@Body('email') email) {
    try {
      await this.userService.getByEmail(email);
      return { exists: true };
    } catch (err) {
      return { exists: false };
    }
  }

  @Post('register')
  async register(
    @Body('name') name,
    @Body('email') email,
    @Body('password') password,
    @Body('birthAt') birthAt,
    @Body('phone') phone,
    @Body('document') document,
  ) {
    if (birthAt) {
      try {
        birthAt = parse(birthAt, 'yyyy-MM-dd', new Date());
      } catch (err) {
        throw new BadRequestException('Birth date is invalid');
      }
    }

    const user = await this.userService.create({
      name,
      email,
      password,
      birthAt,
      phone,
      document,
    });

    const token = await this.authService.getToken(user.id);

    return { user, token };
  }

  @Post('login')
  async login(@Body('email') email, @Body('password') password) {
    return this.authService.login({ email, password });
  }

  @Get('me')
  async me(@Headers('authorization') authorization) {
    const token = authorization.split(' ')[1];

    return this.authService.decodeToken(token);
  }
}
