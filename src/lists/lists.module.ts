import { Module, NestModule} from '@nestjs/common';
import { ListController } from './controllers/lists.controller';
import { ItemsController } from './controllers/items.controller';
import { FavouritesController } from './controllers/favourites.controller';
import { ItemService } from './services/items.service';
import { ConfigService } from '../config/services/config.service';
import { ConfigModule } from '../config/config.module';
const AWS = require('aws-sdk');

const dynamodbClientFactory = {
    provide: 'DYNAMODB_CLIENT',
    useFactory: async (config) => {
      if ('development' === await config.get("APPLICATION_ENV")) {
        AWS.config.loadFromPath('./config.local.json');
      }
      return new AWS.DynamoDB.DocumentClient({apiVersion: '2012-08-10'});
    },
    inject:[ConfigService]
  };

@Module({
    imports: [ConfigModule],
    controllers: [ListController, ItemsController, FavouritesController],
    providers: [
        ItemService,
        dynamodbClientFactory
    ],
    exports: [
        ItemService
    ]
  })
  export class ListsModule{

  }
  