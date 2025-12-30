import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PostsModule } from './posts/posts.module';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    PostsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
