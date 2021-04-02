var AWS = require('aws-sdk');
AWS.config.loadFromPath('./config.local.json');

var ddb = new AWS.DynamoDB({apiVersion: '2012-08-10'});
ddb.deleteTable({
  TableName : "XmasList"
})
var params = {
    AttributeDefinitions: [
        {
          AttributeName: 'pk',
          AttributeType: 'S'
        },
        {
          AttributeName: 'sk',
          AttributeType: 'S'
        }
      ],
    KeySchema: [
        {
          AttributeName: 'pk',
          KeyType: 'HASH'
        },
        {
          AttributeName: 'sk',
          KeyType: 'RANGE'
        }
    ],
    ProvisionedThroughput: {
        ReadCapacityUnits: 5, 
        WriteCapacityUnits: 5
    }, 
    GlobalSecondaryIndexes: [
      {
        IndexName:'list_owner_index',
        KeySchema: [
          {
            AttributeName: 'sk',
            KeyType: 'HASH'
          },
          {
            AttributeName: 'pk',
            KeyType: 'RANGE'
          }
        ],
        Projection: {
          ProjectionType: "ALL"
        },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5
        }
      } 
    ],
    TableName: "XmasList"
   };

   ddb.createTable(params, function(err, data) {
     if (err) console.log(err, err.stack); // an error occurred
     else     console.log(data);           // successful response
   });