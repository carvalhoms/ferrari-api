import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { parse } from 'date-fns';
import { UserService } from 'src/user/user.service';

@Controller('auth')
export class AuthController {
  constructor(private userService: UserService) {}

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

    return this.userService.create({
      name,
      email,
      password,
      birthAt,
      phone,
      document,
    });
  }
}
