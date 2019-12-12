import {SecretsStore} from './secrets-store.service';
import { Injectable } from '@nestjs/common';
const AWS = require('aws-sdk');

@Injectable()
export class AWSSecretsStore extends SecretsStore {

    private client;

    private cache;

    constructor() {
        super();
        this.client = new AWS.SecretsManager({
            region: 'eu-west-2',
        });

    }

    get(key: string): Promise<string> {

        if(this.cache && key in this.cache) {
            return Promise.resolve(this.cache[key]);
        }

        return this.client.getSecretValue({SecretId: 'XmasApiSecrets'}).promise()
            .then((data) => {
                this.cache = JSON.parse(data.SecretString);
                return JSON.parse(data.SecretString)[key];
            })
            .catch((err) => {
                console.log("[aws secrets] " + err.code + " - " + err.message);
                if (err.code === 'DecryptionFailureException')
                    // Secrets Manager can't decrypt the protected secret text using the provided KMS key.
                    // Deal with the exception here, and/or rethrow at your discretion.
                    throw err;
                else if (err.code === 'InternalServiceErrorException')
                    // An error occurred on the server side.
                    // Deal with the exception here, and/or rethrow at your discretion.
                    throw err;
                else if (err.code === 'InvalidParameterException')
                    // You provided an invalid value for a parameter.
                    // Deal with the exception here, and/or rethrow at your discretion.
                    throw err;
                else if (err.code === 'InvalidRequestException')
                    // You provided a parameter value that is not valid for the current state of the resource.
                    // Deal with the exception here, and/or rethrow at your discretion.
                    throw err;
                else if (err.code === 'ResourceNotFoundException')
                    // We can't find the resource that you asked for.
                    // Deal with the exception here, and/or rethrow at your discretion.
                    throw err;
            });
    }
}


