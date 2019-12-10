import { Module, NestModule, MiddlewareConsumer} from '@nestjs/common';
import { ListItemsController } from './lists/lists.controller';
import { ItemService } from './lists/items.service';
import { LoggerMiddleware } from './logger.middleware';
import { AuthenticationMiddleware } from './authentication.middleware';
import { LoginController } from './login/login.controller';
import { AuthService } from './login/auth.service';
import { EmailService } from './email.service';
import {SecretsStore} from './secrets/SecretsStore';
import { LocalSecretsStore } from './secrets/LocalSecretsStore';
import { AWSSecretsStore } from './secrets/AWSSecretsStore';
const AWS = require('aws-sdk');
const nodemailer = require("nodemailer");


const dynamodbClientFactory = {
  provide: 'DYNAMODB_CLIENT',
  useFactory: () => {
    if ('local' === process.env.APPLICATION_ENV) {
      AWS.config.loadFromPath('./config.local.json');
    }
    return new AWS.DynamoDB.DocumentClient({apiVersion: '2012-08-10'});
  }
};

const smtpClientFactory = {
  provide: 'SMTP_CLIENT',
  useFactory: async (secretsStore) => {
    
    let smtpConfig  = {};
    switch(process.env.APPLICATION_ENV) {

      case 'production':
        smtpConfig = {
          host: 'smtp.sendgrid.net',
          port: 587,
          secure: false,
          auth: {
              user: 'apikey',
              pass: await secretsStore.get('SMTP_PASS')
          }
        }
        break;

      default:
        smtpConfig = {
          host: 'smtp.mailtrap.io',
          port: 465,
          secure: false,
          auth: {
              user: await secretsStore.get('SMTP_USER'),
              pass: await secretsStore.get('SMTP_PASS')
          }
        }
    }

    return nodemailer.createTransport(smtpConfig);
  },
  inject: [SecretsStore]
};


@Module({
  imports: [],
  controllers: [ListItemsController, LoginController],
  providers: [
    ItemService,
    AuthService,
    EmailService,
    dynamodbClientFactory,
    smtpClientFactory,
    {
      provide: SecretsStore,
      useFactory: () => {
        switch (process.env.APPLICATION_ENV) {
          case 'development':
            return new LocalSecretsStore(`.env.${process.env.APPLICATION_ENV || 'development'}`);
          default:
            return new AWSSecretsStore();
        }
      }
    }]
})
export class AppModule implements NestModule{
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware, AuthenticationMiddleware)
      .forRoutes('*');
  }
}
