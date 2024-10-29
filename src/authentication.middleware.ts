import { Injectable, NestMiddleware, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './login/auth.service';

@Injectable()
export class AuthenticationMiddleware implements NestMiddleware {

  constructor(private authService: AuthService) {
  }

  use(request: Request, response: Response, next: () => void) {

    // cast as any to workaround https://github.com/DefinitelyTyped/DefinitelyTyped/issues/40138
    let authHeader = (request as any).get('Authorization') || '';
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
