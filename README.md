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


## Table schema

| primary (pk)        | secondary (sk)     | item          | ttl         | bought_by       | name            | uuid      |
| ------------------- | ------------------ |-------------- |-------------| --------------- | --------------- | --------- |
| {user-email}        | ListId             |               | {timestamp} |                 |                 | {listid*} |
| {userid}            | Name               |               |             |                 | <name-of-list>  |           |
| {userid}            | ListId             |               | {timestamp} |                 |                 |           |
| {userid}            | ListItem{ListUuid} | {description} | {timestamp} | {buyer-useruid} |                 |           |
| {userid}_favourites | {listuid*}         |               |             |                 |                 |           |

\* currently listid is synonymous with user id 


## Authentication

Authentication is handled through Auth0. Either through username/password or gmail account. In either case the token from Auth0 is passed in the `Authorization` header as `Bearer <token>`. 

The token is validated using the shared secret key (see `AUTH0_SECRET` in config/secrets). The authenticated user's email is contained in the attribute
`https://xmas.c7e.uk/email`.


