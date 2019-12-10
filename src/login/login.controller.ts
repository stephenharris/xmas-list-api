import { Controller, Get, Query, Post, Body, Put, Param, Delete, HttpCode, UsePipes } from '@nestjs/common';
import { AuthService } from './auth.service';
import { BadRequestException} from '@nestjs/common';

@Controller()
export class LoginController {

  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(200)
  async createItem(@Body() body) {
    try {
        let token = null;
        switch (body.strategy) {
          case 'google':
            console.log('log-in with google');
            token = await this.authService.authenticateWithGoogle(body.token);
            break;
          case 'email':
          default:
            token = await this.authService.confirmEmail(body.token);
            break;
        }

        if(!token) {
          throw new BadRequestException('AuthenticationFailed');
        }
        
        return {
          "token": token
        };
    } catch (error) {
        console.log("error", error);
        throw error;   
    }
  }

  @Post('confirm-email')
  @HttpCode(200)
  confirmEmail(@Body() body) {
    
    try {
        return this.authService.sendEmailConfirmation(body.email);
    } catch (error) {
        console.log("error", error);
        throw error;   
    }
  }


  



}
