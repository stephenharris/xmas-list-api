import { Module } from '@nestjs/common';
import { SecretsStore } from './services/secrets-store.service';
import { ConfigService } from './services/config.service';
import { AWSSecretsStore } from './services/aws-secrets-store.service';

const secretsStore = {
    provide: SecretsStore,
    useClass: AWSSecretsStore,
  }
  

@Module({
    providers: [secretsStore, ConfigService],
    exports: [SecretsStore, ConfigService],
})
export class ConfigModule {

}
