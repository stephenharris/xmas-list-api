import { Injectable } from '@nestjs/common';
import { EmailService } from '../email.service';
import { ItemService } from '../lists/services/items.service';
import { ConfigService } from '../config/services/config.service';

var jwt = require('jsonwebtoken');

@Injectable()
export class AuthService {
    
    constructor(private readonly itemService: ItemService, private config: ConfigService, private emailService: EmailService) {
    }

    public async authenticateToken(token) {
        try {
            var decoded = jwt.verify(token, await this.config.get('SECRET'));
            let userUuid = await this.itemService.getOrCreateUserId(decoded.email);
            return { email: decoded.email, userUuid: userUuid }
        } catch(err) {
            console.log('[authentication failed] ' + err.message);
            console.log('Trying with Auth0');
            try {
                var decoded = jwt.verify(token, await this.config.get('AUTH0_SECRET'));
                let email = decoded['https://c7e.uk/email']
                let userUuid = await this.itemService.getOrCreateUserId(email);
                return { email: email, userUuid: userUuid }
            } catch(err) {
                console.log('[auth0 authentication failed] ' + err.message);
                console.log(err);
                return null;
            }
        }
    }

}
