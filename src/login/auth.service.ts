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

    private async createToken(user) {
        let listId = await this.itemService.getListId(user);

        if (!listId) {
            listId = await this.itemService.createListId(user);
        }

        let token = jwt.sign(
            { list: listId, email: user },
            await this.config.get('SECRET'),
            {
                expiresIn: '24 days'
            }
        );

        return token;
    }

    public async authenticateToken(token) {;
        try {
            var decoded = jwt.verify(token, await this.config.get('SECRET'));
            //TODO check if list ID exists
            return decoded;
        } catch(err) {
            console.log('[authentication failed] ' + err.message);
            console.log(err);
            return null;
        }
    }

    public async sendEmailConfirmation(email) {
        let token = jwt.sign(
            { email: email },
            await this.config.get('SECRET'),
            {
                expiresIn: '15 minutes'
            }
        );
        
        return this.emailService.sendEmail(email, `Click this link: ${token}`)
            .then(()=>{
                return {
                    'token': token
                }
            })
            .catch((error) =>{
                console.log(error);
            });
    }

    public async confirmEmail(token) {
        try {
            var decoded = jwt.verify(token, await this.config.get('SECRET'));
            return this.createToken(decoded.email);
        } catch(err) {
            console.log(`[login by email failed]` + err.message);
            console.log(err);
            return null;
        }
    }

    public async authenticateWithGoogle(googleToken) {
        const googleCLientId = await this.config.get('GOOGLE_CLIENT_ID');
        const client = new OAuth2Client(googleCLientId);
        
        return client.verifyIdToken({
            idToken: googleToken,
            audience: googleCLientId,// Specify the CLIENT_ID of the app that accesses the backend
        }).then((ticket) => {
            let payload = ticket.getPayload();
            let email = payload['email'];
            return this.createToken(email);
        })
        .catch((err) => {
            console.log(`[login by google failed]` + err.message);
            console.log(err);
            return null;
        });
    }

}
