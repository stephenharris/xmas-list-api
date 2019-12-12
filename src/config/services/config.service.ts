import * as dotenv from 'dotenv';
import * as fs from 'fs';
import {SecretsStore} from './secrets-store.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ConfigService {

    private readonly envConfig: Record<string, string>;

    constructor(private secretStore: SecretsStore) {
        dotenv.config();
    }

    async get(key: string): Promise<string> {
        let value = process.env[key];
        let matches = (''+value).match(/^{{(.*)}}$/);
        if(matches && matches[1]) {
            
            let secret = await this.secretStore.get(matches[1]);
            if (secret) {
                value = secret;
            }
        }
      return Promise.resolve(value);
    }
}


