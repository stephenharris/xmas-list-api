import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response } from 'express';

@Injectable()
export class VersionHeader implements NestMiddleware {
  use(request: Request, response: Response, next: () => void) {
    response.set('X-Env', process.env.APPLICATION_ENV);
    response.set('X-Ver', process.env.APPLICATION_VER);
    next();
  }
}
