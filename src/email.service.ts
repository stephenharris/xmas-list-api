import { Injectable, Inject } from '@nestjs/common';

@Injectable()
export class EmailService {
    
    constructor(@Inject('SMTP_CLIENT') private smtpClient) {
    
    }

}

