# Xmas List

An API that allows you to create and share lists

## Getting started

    docker-compose up --build

This creates a NodeJS container, with NestJS installed and a DynamoDB container.

When the containers have started, create the DynamoDB table:

    docker exec -it lists nodejs create-table.js

## Deployment


    docker exec -it lists ./node_modules/serverless/bin/serverless deploy

