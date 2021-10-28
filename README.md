# Xmas List

An API that allows you to create and share lists

## Getting started (local development)

    docker-compose up --build

This creates a NodeJS container, with NestJS installed and a DynamoDB container.

When the containers have started, create the local DynamoDB table:

    docker exec -it lists nodejs create-table.js

## Deployment

Deployment uses serverless. Following their documentation, ensure `.aws/credentials` has your AWS credentials and then run:

    docker exec -it lists npm run deploy:prod


## Running tests

```
docker exec -it lists npm run test
```


## Running test

```
docker exec -it lists npm run test:e2e
```

## Table schema

| primary (pk)        | secondary (sk)     | item          | ttl         | bought_by       | name            | uuid      |
| ------------------- | ------------------ |-------------- |-------------| --------------- | --------------- | --------- |
| {user-email}        | ListId             |               | {timestamp} |                 |                 | {listid*} |
| {userid}            | Name               |               |             |                 | <name-of-list>  |           |
| {userid}            | ListId             |               | {timestamp} |                 |                 |           |
| {userid}            | ListItem{itemuid} | {description} | {timestamp} | {buyer-useruid} |                 |           |
| {userid}_favourites | {listuid*}         |               |             |                 |                 |           |


New:

TODO how to store user id --> lists and list id -> list metadata (e.g. name)

| primary (pk)             | secondary (sk)     | item          | ttl         | bought_by       | name            | uuid       |
| ------------------------ | ------------------ |-------------- |-------------| --------------- | --------------- | ---------- |
| user:{user-email}        | UserId             |               |             |                 |                 | {useruuid} |
| list:{listuuid}          | owner:{owner-uuid} |               |             |                 | <name-of-list>  | {listuuid} |
| list:{listuuid}          | item:{itemuid}     | {description} | {timestamp} | {buyer-useruid} |                 |            |
| favouritelists:{userid}  | {listuuid}         |               |             |                 |                 |            |





\* currently listid is synonymous with user id 


## Authentication

Authentication is handled through Auth0. Either through username/password or gmail account. In either case the token from Auth0 is passed in the `Authorization` header as `Bearer <token>`. 

The token is validated using the shared secret key (see `AUTH0_SECRET` in config/secrets). The authenticated user's email is contained in the attribute
`https://xmas.c7e.uk/email`.




some, or all of these, as required.

AWS_REGION=local AWS_ACCESS_KEY_ID=foo AWS_SECRET_ACCESS_KEY=bar dynamodb-admin

curl localhost:3001/list/health


LIST_ID=$(curl -s localhost:3001/list | jq -r .[0].uuid)

curl localhost:3001/list-item/$LIST_ID | jq

curl -X POST -H "Content-Type: application/json" -d '{"description": "foo"}' localhost:3001/list-item/$LIST_ID

curl -X POST -H "Content-Type: application/json" -d '{"description": "bar"}' localhost:3001/list-item/$LIST_ID

ITEM_ID=$(curl -s localhost:3001/list-item/$LIST_ID | jq -r .items[0].id)
curl -X DELETE  localhost:3001/list-item/$LIST_ID/$ITEM_ID


TODO- this overrides owner
curl -X PUT -H "Content-Type: application/json" -d '{"name": "my new list"}' localhost:3001/list-item/$LIST_ID/

curl localhost:3001/list-item/$LIST_ID | jq

ITEM_ID=$(curl -s localhost:3001/list-item/$LIST_ID | jq -r .items[0].id)
curl -X POST -H "Content-Type: application/json" localhost:3001/mark-item/$LIST_ID/$ITEM_ID


curl -X DELETE -H "Content-Type: application/json" localhost:3001/mark-item/$LIST_ID/$ITEM_ID


curl localhost:3001/list-item/g0qi6zt0 | jq


TODO
- Delete favourited list when list is deleted
- Delete items from list when list is deletd




