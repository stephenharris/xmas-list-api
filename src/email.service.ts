import { Injectable, Inject } from '@nestjs/common';

@Injectable()
export class EmailService {
    
    constructor(@Inject('SMTP_CLIENT') private smtpClient) {
    
    }

    public async sendEmail(recipient, message) {

        console.log(`Send email to ${recipient}`);
        let info = await this.smtpClient.sendMail({
            from: '"Fred Foo 👻" <foo@example.com>', // sender address
            to: recipient,
            subject:'Confirm your email',
            //text: "message", // plain text body
            html: message // html body
        });
        
        console.log("Message sent: %s %s", info.messageId, info.response);
    }

}

