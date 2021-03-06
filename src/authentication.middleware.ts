import { Injectable, NestMiddleware, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './login/auth.service';

@Injectable()
export class AuthenticationMiddleware implements NestMiddleware {

  constructor(private authService: AuthService) {
  }

  use(request: Request, response: Response, next: () => void) {

    let authHeader = request.get('Authorization') || '';
    this.authService.authenticateToken(authHeader.replace("Bearer","").trim())
      .then((decoded) => {
        response.locals.authorizedUser = decoded.userUuid;
        console.log(`logged in as ${decoded.userUuid}`);
        next();
      })
      .catch((err) => {
        //fail silently
        next();
      })
  }
}
