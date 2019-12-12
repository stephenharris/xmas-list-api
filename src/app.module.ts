import { Module, NestModule, MiddlewareConsumer} from '@nestjs/common';
import { LoggerMiddleware } from './logger.middleware';
import { VersionHeader } from './version-header.middleware';
import { AuthenticationMiddleware } from './authentication.middleware';
import { LoginController } from './login/login.controller';
import { AuthService } from './login/auth.service';
import { EmailService } from './email.service';
import { ConfigModule } from './config/config.module';
import { ConfigService } from './config/services/config.service';

import { ListsModule } from './lists/lists.module';

const nodemailer = require("nodemailer");

const smtpClientFactory = {
  provide: 'SMTP_CLIENT',
  useFactory: async (config) => {
    return nodemailer.createTransport({
      host: await config.get('SMTP_HOST'),
      port: await config.get('SMTP_PORT'),
      secure: false,
      auth: {
          user: await config.get('SMTP_USER'),
          pass: await config.get('SMTP_PASS')
      }
    });
  },
  inject: [ConfigService]
};


@Module({
  imports: [ListsModule, ConfigModule],
  controllers: [LoginController],
  providers: [
    AuthService,
    EmailService,
    smtpClientFactory]
})
export class AppModule implements NestModule{
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware, VersionHeader, AuthenticationMiddleware)
      .forRoutes('*');
  }
}
