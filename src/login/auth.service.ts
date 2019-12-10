import { Injectable } from '@nestjs/common';
import { ItemService } from '../lists/items.service';
import { EmailService } from '../email.service';
import {OAuth2Client} from 'google-auth-library';
import { SecretsStore } from 'src/secrets/SecretsStore';

var jwt = require('jsonwebtoken');

@Injectable()
export class AuthService {
    
    constructor(private readonly itemService: ItemService, private secretsStore: SecretsStore, private emailService: EmailService) {
    }

    private async createToken(user) {
        let listId = await this.itemService.getListId(user);

        if (!listId) {
            listId = await this.itemService.createListId(user);
        }

        let token = jwt.sign(
            { list: listId, email: user },
            await this.secretsStore.get('SECRET'),
            {
                expiresIn: '24 days'
            }
        );

        return token;
    }

    public async authenticateToken(token) {;
        try {
            var decoded = jwt.verify(token, await this.secretsStore.get('SECRET'));
            //TODO check if list ID exists
            return decoded;
        } catch(err) {
            console.log('[authentication failed] ' + err.message);
            console.log(err);
            return null;
        }
    }

    public async sendEmailConfirmation(email) {
        console.log(`[login by email] ${email}`);
        
        console.log(await this.secretsStore.get('SECRET'));
        let token = jwt.sign(
            { email: email },
            await this.secretsStore.get('SECRET'),
            {
                expiresIn: '15 minutes'
            }
        );
        
        this.emailService.sendEmail(email, `Click this link: ${token}`).catch((error) =>{
            console.log(error);
        });

        return {
            'token': token
        }
    }

    public async confirmEmail(token) {
        try {
            var decoded = jwt.verify(token, await this.secretsStore.get('SECRET'));
            console.log(decoded);
            return this.createToken(decoded.email);
        } catch(err) {
            console.log(`[login by email failed]` + err.message);
            console.log(err);
            return null;
        }
    }

    public async authenticateWithGoogle(googleToken) {
        const googleCLientId = await this.secretsStore.get('GOOGLE_CLIENT_ID');
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
