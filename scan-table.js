var AWS = require('aws-sdk');
AWS.config.loadFromPath('./config.local.json');

var ddb = new AWS.DynamoDB({apiVersion: '2012-08-10'});

var params = {
    TableName: "XmasList"
   };

   ddb.scan(params, function(err, data) {
     if (err) console.log(err, err.stack); // an error occurred
     else     console.log(data);           // successful response
   });