import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  Put,
  UseInterceptors,
  UploadedFile,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { parse } from 'date-fns';
import { User } from 'src/user/user.decorator';
import { UserService } from 'src/user/user.service';
import { Auth } from './auth.decorator';
import { AuthGuard } from './auth.guard';
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

  @UseGuards(AuthGuard)
  @Get('me')
  async me(@Auth() auth, @User() user) {
    return {
      auth,
      user,
    };
  }

  @UseGuards(AuthGuard)
  @Put('profile')
  async profile(@User() user, @Body() body) {
    if (body.birthAt) {
      body.birthAt = parse(body.birthAt, 'yyyy-MM-yy', new Date());
    }

    return this.userService.update(user.id, body);
  }

  @UseGuards(AuthGuard)
  @Put('password')
  async changePassword(
    @Body('currentPassword') currentPassword,
    @Body('newPassword') newPassword,
    @User('id') id,
  ) {
    return this.userService.changePassword(id, currentPassword, newPassword);
  }

  @Post('forget')
  async forget(@Body('email') email) {
    return this.authService.recovery(email);
  }

  @Post('password-reset')
  async resetPassword(@Body('password') password, @Body('token') token) {
    return this.authService.reset({ password, token });
  }

  @UseGuards(AuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      dest: './storage/photos',
      limits: {
        fieldSize: 5 * 1024 * 1024, //5mb
      },
    }),
  )
  @Put('photo')
  async setPhoto(@User() user, @UploadedFile() file) {
    return this.userService.setPhoto(user.id, file);
  }

  @UseGuards(AuthGuard)
  @Get('photo')
  async getPhoto(@User('id') id, @Res({ passthrough: true }) response) {
    const { file, extension } = await this.userService.getPhoto(id);

    switch (extension) {
      case 'png':
        response.set({ 'Content-Type': 'image/png' });
        break;

      default:
        response.set({ 'Content-Type': 'image/jpg' });
        break;
    }

    return new StreamableFile(file);
  }
}
