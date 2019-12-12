import { Injectable, Inject } from '@nestjs/common';

@Injectable()
export class EmailService {
    
    constructor(@Inject('SMTP_CLIENT') private smtpClient) {
    
    }

    public async sendEmail(recipient, message) {

        console.log(`Send email to ${recipient}`);
        return this.smtpClient.sendMail({
            from: '"Father Christmas 🎅" <no-reply@example.com>', // sender address
            to: recipient,
            subject:'Confirm your email',
            //text: "message", // plain text body
            html: message // html body
        })
        .then((info) => {
            console.log(`Message sent: ${info.messageId} ${info.response}`);
        })
        .catch((error) => {
            console.log("Error sending email:", error);
        })
        

    }

}

