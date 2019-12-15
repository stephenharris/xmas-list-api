import { AuthenticationMiddleware } from './authentication.middleware';
import { mockRequest, mockResponse } from 'mock-req-res';
import { when } from 'jest-when';

jest.mock('./login/auth.service');

describe('AuthenticationMiddleware', () => {

  let authService;

  beforeEach(() => {
    authService = require('./login/auth.service').AuthService;
    //mockAuthToken ;
    authService.authenticateToken = jest.fn();
  });


  it('should extract the authorizatin token', async () => {
    let request = mockRequest();
    let response = mockResponse({locals: {}});

    when(authService.authenticateToken).calledWith('J.W.T').mockReturnValue(Promise.resolve({
      "list":"ABCD1234"
    }));

    request.get.withArgs('Authorization').returns('Bearer J.W.T');
    
    const authMiddleware = new AuthenticationMiddleware(authService);

    await new Promise((resolve) => {
      authMiddleware.use(request, response, ()=>resolve(response));
    });
    
    expect(response.locals.authorizedUser).toEqual("ABCD1234");
  });


  it('should not authenticate if the toke is invalid', async () => {
    let request = mockRequest();
    let response = mockResponse({locals: {}});

    when(authService.authenticateToken).calledWith('InvalidJ.W.T').mockReturnValue(Promise.reject());


    request.get.withArgs('Authorization').returns('Bearer InvalidJ.W.T');
    
    const authMiddleware = new AuthenticationMiddleware(authService);

    await new Promise((resolve) => {
      authMiddleware.use(request, response, resolve);
    });
    
    expect(response.locals.authorizedUser).toEqual(undefined);
  });

});
