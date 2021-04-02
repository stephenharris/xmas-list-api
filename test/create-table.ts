var AWS = require('aws-sdk');
AWS.config.loadFromPath('./config.local.json');

export function createTable() {
  console.log("createtable")
  var ddb = new AWS.DynamoDB({apiVersion: '2012-08-10'});
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

  console.log('clear:')
  return ddb.deleteTable({TableName : params.TableName}).promise()
      .finally(() => ddb.waitFor('tableNotExists', {TableName : params.TableName}).promise())
      .finally(() => ddb.createTable(params).promise())
      .then(() => {
        console.log("creating table");
        return true;
      })
      .then(() => ddb.waitFor('tableExists', {TableName : params.TableName}).promise())
      .then(() => {
        console.log("created");
        return true;
      });
}