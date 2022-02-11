import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [UserModule, PrismaModule],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
