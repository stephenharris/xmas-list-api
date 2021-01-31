import { Injectable } from '@nestjs/common';
import { EmailService } from '../email.service';
import {OAuth2Client} from 'google-auth-library';
import { ItemService } from '../lists/services/items.service';
import { ConfigService } from '../config/services/config.service';

var jwt = require('jsonwebtoken');

@Injectable()
export class AuthService {
    
    constructor(private readonly itemService: ItemService, private config: ConfigService, private emailService: EmailService) {
    }

    private async createToken(email) {

        let listId = await this.getOrCreateListId(email);
        let token = jwt.sign(
            { list: listId, email: email },
            await this.config.get('SECRET'),
            {
                expiresIn: '24 days'
            }
        );

        return token;
    }

    private async getOrCreateListId(email) {
        let listId = await this.itemService.getListId(email);

        if (!listId) {
            listId = await this.itemService.createListId(email);
        }

        return listId;
    }

    public async authenticateToken(token) {;
        try {
            var decoded = jwt.verify(token, await this.config.get('SECRET'));
            //TODO check if list ID exists
            return decoded;
        } catch(err) {
            console.log('[authentication failed] ' + err.message);
            console.log('Trying with Auth0');
            try {
                var decoded = jwt.verify(token, await this.config.get('AUTH0_SECRET'));
                let email = decoded['https://xmas.c7e.uk/email']
                let listId = await this.getOrCreateListId(email);
                
                return { list: listId, email: email }
            } catch(err) {
                console.log('[authentication failed] ' + err.message);
                console.log(err);
                return null;
            }
        }
    }

}
