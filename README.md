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

