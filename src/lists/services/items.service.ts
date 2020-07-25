import { Injectable, Inject } from '@nestjs/common';
import { createHash } from 'crypto';
import { uuid } from 'uuidv4';
@Injectable()
export class ItemService {

    constructor(@Inject('DYNAMODB_CLIENT') private ddb) {
    }

    public async addToList(itemDescription, userUuid) {
        let timestamp  = Math.floor((new Date()).getTime()/ 1000);
        const itemUuid =  timestamp + '-' + uuid();
        var params = {
            TableName: "XmasList",
            Item: {
                "pk": userUuid,
                "sk": "ListItem" + itemUuid,
                "item": itemDescription,
                "ttl": timestamp + 15768000, //expires in 6 months
            }
        };

        console.log(`${userUuid} added ${itemUuid} to their list`);
        
        await this.ddb.put(params).promise();

        return itemUuid;
    }


    public async markItemAsBought(userUuid, itemUuid, boughtBy) {
        var params = {
            TableName: "XmasList",
            Key: {
                "pk": userUuid,
                "sk": "ListItem" + itemUuid,
            },
            UpdateExpression: 'set #boughtBy = :boughtBy',
            ConditionExpression: 'attribute_not_exists(#boughtBy) or #boughtBy = :null',
            ExpressionAttributeNames: {
                '#boughtBy' : 'boughtBy'
            },
            ExpressionAttributeValues: {
              ':boughtBy' : boughtBy,
              ':null': null
            },
            ReturnValues: 'ALL_NEW'
        };

        console.log(`${userUuid} marked ${itemUuid} as bought`);

        return this.ddb.update(params).promise().then((response) => {
            return {
                'id': response.Attributes.sk.substr(8),
                'description': response.Attributes.item,
                'boughtBy': response.Attributes.boughtBy ? response.Attributes.boughtBy : null
            }
        });
    }

    public async unmarkItemAsBought(userUuid, itemUuid, boughtBy) {
        var params = {
            TableName: "XmasList",
            Key: {
                "pk": userUuid,
                "sk": "ListItem" + itemUuid,
            },
            UpdateExpression: 'set #boughtBy = :null',
            ConditionExpression: '#boughtBy = :boughtBy',
            ExpressionAttributeNames: {
                '#boughtBy' : 'boughtBy'
            },
            ExpressionAttributeValues: {
              ':boughtBy' : boughtBy,
              ':null': null
            },
            ReturnValues: 'ALL_NEW'
        };

        console.log(`${userUuid} unmarked ${itemUuid} as bought`);

        return this.ddb.update(params).promise().then((response) => {
            return {
                'id': response.Attributes.sk.substr(8),
                'description': response.Attributes.item,
                'boughtBy': response.Attributes.boughtBy ? response.Attributes.boughtBy : null
            }
        });
    }


    public async getList(userUuid) {
        var params = {
            TableName : "XmasList",
            KeyConditionExpression : "pk = :userUuid and begins_with(sk,:listItem)",
            ExpressionAttributeValues : {
                ':userUuid' : userUuid,
                ':listItem': 'ListItem'
            }
        };
        let items = await this.ddb.query(params).promise().then((response) => {
            return response.Items.map((item) => {
                return {
                    'id': item.sk.substr(8),
                    'description': item.item,
                    'boughtBy': item.boughtBy ? item.boughtBy : null
                }
            });
        });
    
        var nameParams = {
            TableName: "XmasList",
            Key: {
                "pk": userUuid,
                "sk": "Name"
            }
        };

        let response = await this.ddb.get(nameParams).promise();
        let name = response?.Item?.name;

        return {
            name: name,
            items: items
        }
    }

    private listExists(listId) {
        var params = {
            TableName : "XmasList",
            KeyConditionExpression : "pk = :listId",
            ExpressionAttributeValues : {
                ':listId' : listId
            }
        };

        return this.ddb.query(params).promise().then((response) => {
            return response.Items.length > 0;
        }).catch((error) => {
            console.log(error)
            throw new Error('Error checking if list exists');
        });
    }


    public async removeItemFromList(itemUuid, userUuid) {
        var params = {
            TableName: "XmasList",
            Key: {
                "pk": userUuid,
                "sk": "ListItem" + itemUuid
            }
        };

        console.log(`${userUuid} removed ${itemUuid} from their list`);
        
        await this.ddb.delete(params).promise();
    }


    public async createListId(userEmail) {
        
        //Generate list
        const listId = await this.generateListId();
        let timestamp  = Math.floor((new Date()).getTime()/ 1000);
        
        // Store list ID
        await this.ddb.put({
            TableName: "XmasList",
            Item: {
                "pk": listId ,
                "sk": "ListId",
                "ttl": timestamp + 15768000, //expires in 6 months
            },
            ConditionExpression: 'attribute_not_exists(pk)'
        }).promise().then().catch((error) => {
            console.log(error);
            throw new Error('creatingListFailed'); 
        });

        // Store list name
        await this.ddb.put({
            TableName: "XmasList",
            Item: {
                "pk": listId ,
                "sk": "Name",
                "name": `${userEmail}'s list`
            },
            //ConditionExpression: 'attribute_not_exists(pk)'
        }).promise().then().catch((error) => {
            console.log(error);
            throw new Error('naming list failed'); 
        });

        // Store mapping from user to list
        const params = {
            TableName: "XmasList",
            Item: {
                "pk": userEmail,
                "sk": "ListId",
                "uuid": listId,
                "ttl": timestamp + 15768000, //expires in 6 months
            },
            ConditionExpression: 'attribute_not_exists(pk)'
        };

        return this.ddb.put(params).promise()
            .then((item) => {
                let hashedEmail = this.hashEmail(userEmail);
                console.log(`${hashedEmail} created list Id ${listId}`);
                return listId;
            })
            .catch((error) => {
                if ('ConditionalCheckFailedException' === error.code) {
                    return this.getListId(userEmail);
                } else {
                    console.log(error);
                    throw new Error('creatingListFailed');
                }

            })
    }

    public async updateListMeta(listUuid, meta) {
        // Store list name
        await this.ddb.put({
            TableName: "XmasList",
            Item: {
                "pk": listUuid ,
                "sk": "Name",
                "name": meta.name
            },
        }).promise().then().catch((error) => {
            console.log(error);
            throw new Error('naming list failed'); 
        });
    }

    public async getListId(userEmail) {
        var params = {
            TableName: "XmasList",
            Key: {
                "pk": userEmail,
                "sk": "ListId"
            }
        };

        let response = await this.ddb.get(params).promise();
        return response.Item ? response.Item.uuid : null;
    }

    private hashEmail(email) {
        let md5hash = createHash('md5');
        md5hash.update(email);
        return md5hash.digest('hex');
    }

    private async generateListId() {

        let keyExists = true;
        let listId = Math.round((Math.pow(36, 9) - Math.random() * Math.pow(36, 8))).toString(36).slice(1);

        while(keyExists) {
            listId = Math.round((Math.pow(36, 9) - Math.random() * Math.pow(36, 8))).toString(36).slice(1);
            keyExists = await this.listExists(listId);
        }
        return listId ;
    }

}
