import { Module, NestModule} from '@nestjs/common';
import { ListItemsController } from './controllers/lists.controller';
import { ItemService } from './services/items.service';
const AWS = require('aws-sdk');

const dynamodbClientFactory = {
    provide: 'DYNAMODB_CLIENT',
    useFactory: () => {
      if ('development' === process.env.APPLICATION_ENV) {
        AWS.config.loadFromPath('./config.local.json');
      }
      return new AWS.DynamoDB.DocumentClient({apiVersion: '2012-08-10'});
    }
  };

@Module({
    imports: [],
    controllers: [ListItemsController],
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
  