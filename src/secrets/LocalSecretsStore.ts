
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import {SecretsStore} from './SecretsStore';


export class LocalSecretsStore extends SecretsStore {

    private readonly envConfig: Record<string, string>;

    constructor(filePath: string) {
      super();
      this.envConfig = dotenv.parse(fs.readFileSync(filePath));
    }

    get(key: string): Promise<string> {
      return Promise.resolve(this.envConfig[key]);
    }
}


