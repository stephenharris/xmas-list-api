import { Injectable, Inject } from '@nestjs/common';
import { uuid } from 'uuidv4';
import { ConfigService } from '../../config/services/config.service';
@Injectable()
export class ItemService {

    constructor(@Inject('DYNAMODB_CLIENT') private ddb, private config: ConfigService) {
    }

    public async addToList(itemDescription, listId) {
        let timestamp  = Math.floor((new Date()).getTime()/ 1000);
        const itemUuid =  uuid() + '-' + timestamp
        var params = {
            TableName: "XmasList",
            Item: {
                "pk": "list:" + listId,
                "sk": "item:" + itemUuid,
                "item": itemDescription,
                //"ttl": timestamp + 15768000, //expires in 6 months
            }
        };

        console.log(`${itemUuid} added to list ${listId}`);
        
        await this.ddb.put(params).promise();

        return itemUuid;
    }


    public async markItemAsBought(listId, itemUuid, boughtBy) {
        var params = {
            TableName: "XmasList",
            Key: {
                "pk": "list:" + listId,
                "sk": "item:" + itemUuid
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

        console.log(`${itemUuid} marked as bought in list ${listId}`);

        return this.ddb.update(params).promise().then((response) => {
            return {
                'id': response.Attributes.sk.substr(8),
                'description': response.Attributes.item,
                'boughtBy': response.Attributes.boughtBy ? response.Attributes.boughtBy : null
            }
        });
    }

    public async unmarkItemAsBought(listId, itemUuid, boughtBy) {
        var params = {
            TableName: "XmasList",
            Key: {
                "pk": "list:" + listId,
                "sk": "item:" + itemUuid
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

        console.log(`${itemUuid} unmarked as bought in ${listId}`);

        return this.ddb.update(params).promise().then((response) => {
            return {
                'id': response.Attributes.sk.substr(8),
                'description': response.Attributes.item,
                'boughtBy': response.Attributes.boughtBy ? response.Attributes.boughtBy : null
            }
        });
    }

    public async removeItemFromList(itemUuid, listId) {
        var params = {
            TableName: "XmasList",
            Key: {
                "pk": "list:" + listId,
                "sk": "item:" + itemUuid
            }
        };

        console.log(`${itemUuid} removed form list ${listId}`);
        
        await this.ddb.delete(params).promise();
    }


    public async getList(listId) {
        var params = {
            TableName : "XmasList",
            KeyConditionExpression : "pk = :listId",
            ExpressionAttributeValues : {
                ':listId' : "list:"+listId
            }
        };
        let list = await this.ddb.query(params).promise().then((response) => {
            return response.Items
                .reduce((list, item) => {
                    if (item.name) {
                        list.name = item.name
                        list.owner = item.sk.substr(6)
                    } else {
                        list.items.push({
                            'id': item.sk.substr(5), //remove item: prefix
                            'description': item.item,
                            'boughtBy': item.boughtBy ? item.boughtBy : null
                        })
                    }
                    return list;
                }, {"name":"", items: [], owner: ""});
            });

        const url = await this.config.get('APPLICATION_URL');
        list.url = url + '/list/' + listId;
        return list;
    }

    private listExists(listId) {
        var params = {
            TableName : "XmasList",
            KeyConditionExpression : "pk = :listId",
            ExpressionAttributeValues : {
                ':listId' : "list:"+listId
            }
        };

        return this.ddb.query(params).promise().then((response) => {
            return response.Items.length > 0;
        }).catch((error) => {
            console.log(error)
            throw new Error('Error checking if list exists');
        });
    }

    public async getOrCreateUserId(userEmail) {
     
        try {
            return await this.getUserId(userEmail);
        } catch(error) {
            return await this.createUserId(userEmail)
        }
    }

    public userOwnsList(userUuid, listId) {
        var params = {
            TableName : "XmasList",
            Key: {
                "pk": `list:${listId}`,
                "sk": `owner:${userUuid}`
            }
        };

        console.log(`Does ${userUuid} own ${listId}?`)
        
        return this.ddb.get(params).promise()
            .then((resp) => {
                console.log(params);
                console.log("is owned")
                console.log(resp)
                console.log(!! resp?.Item)
                return !! resp?.Item;
            })
            .catch(() => false);
    }

    private async createUserId(userEmail) {
        let timestamp  = Math.floor((new Date()).getTime()/ 1000);
        const userUuid = uuid() + '-' + timestamp
       
        return this.ddb.put({
            TableName: "XmasList",
            Item: {
                "pk": "user:" + userEmail ,
                "sk": "UserId",
                "uuid": userUuid
            },
            ConditionExpression: 'attribute_not_exists(pk)'
        })
        .promise()
        .then(() => this.createList(userUuid, `${userEmail}'s list`))
        .then(() => userUuid)
        .catch((error) => {
            console.log(error);
            throw new Error('creatingListFailed'); 
        });
    }

    public async getUserId(userEmail) {
        var params = {
            TableName : "XmasList",
            Key: {
                "pk": "user:" + userEmail,
                "sk": "UserId"
            }
        };
        
        let userId = await this.ddb.get(params).promise()
            .then((response) => {
                return response.Item?.uuid;
            })
            .catch((error) => {
                throw new Error('Failed to find user'); 
            });

        if (!userId) {
            throw new Error('User not found'); 
        }

        return userId;
    }


    public async createList(userUuid, name) {

        //Generate list
        const listId = await this.generateListId();
        //let timestamp  = Math.floor((new Date()).getTime()/ 1000);
        
        // Store list ID
        return this.ddb.put({
            TableName: "XmasList",
            Item: {
                "pk": "list:" + listId ,
                "sk": "owner:" + userUuid,
                "name": name,
                "uuid": listId
                //"ttl": timestamp + 15768000, //expires in 6 months
            },
            ConditionExpression: 'attribute_not_exists(pk)'
        })
        .promise()
        .then(() => listId)
        .catch((error) => {
            console.log(error);
            throw new Error('creatingListFailed'); 
        });
    }

    public deleteList(userUuid, listId) {

        var params = {
            TableName: "XmasList",
            Key: {
                "pk": "list:" + listId,
                "sk": "owner:" + userUuid
            }
        };
        //TODO delete list items
        console.log(`${userUuid} deleted ${listId}`);
        
        return this.ddb.delete(params).promise();
    }

    /**
     * Upate the name of the given list
     * 
     * @param listUuid The list UUID
     * @param userUuid The owner of the list UUID
     * @param meta object containing metadata (primarily name)
     */
    public async updateListMeta(listUuid, userUuid, meta) {
        await this.ddb.put({
            TableName: "XmasList",
            Item: {
                "pk": "list:" + listUuid ,
                "sk": "owner:" + userUuid,
                "name": meta.name,
                "uuid": listUuid
            },
        }).promise().then().catch((error) => {
            console.log(error);
            throw new Error('naming list failed'); 
        });
    }

    /**
     * Return list Ids associated with an email address
     * @param userEmail 
     */
    public async getUsersLists(userUuid) {

        var params = {
            TableName : "XmasList",
            IndexName: 'list_owner_index',
            KeyConditionExpression : "sk = :userUuid",
            ExpressionAttributeValues : {
                ':userUuid' : "owner:" + userUuid
            }
        };

        return this.ddb.query(params).promise().then((response) => {
            return response.Items.map((list) => {
                return {
                    'id': list.uuid,
                    'name': list.name,
                }
            });
        });
    }

    public async saveList(listUuid, userUuid) {
        //let timestamp  = Math.floor((new Date()).getTime()/ 1000);
        var params = {
            TableName: "XmasList",
            Item: {
                "pk": "favouritelists:" + userUuid,
                "sk": listUuid
            }
        };

        console.log(`${userUuid} saved list ${listUuid}`);
        
        await this.ddb.put(params).promise();

        return true;
    }

    public getFavourites(userUuid) {
        var params = {
            TableName : "XmasList",
            KeyConditionExpression : "pk = :userUuid",
            ExpressionAttributeValues : {
                ':userUuid' : "favouritelists:" + userUuid
            }
        };

        return this.ddb.query(params).promise().then((response) => {
            return response.Items.map((item) => {
                return {
                    'uuid': item.sk,
                }
            });
        });
    }

    public async removeFromFavourites(listUuid, userUuid) {
        var params = {
            TableName: "XmasList",
            Key: {
                "pk": "favouritelists:" + userUuid,
                "sk": listUuid
            }
        };

        console.log(`${userUuid} unfavourited ${listUuid}`);
        
        await this.ddb.delete(params).promise();
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
