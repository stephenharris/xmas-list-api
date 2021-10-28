import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import {createTable} from './create-table';
var jwt = require('jsonwebtoken');

describe('Managing lists', () => {
  let app;
  let accessToken;
  let otherUserAccessToken;
  let listId
  
  beforeEach(async () => {
    
    await createTable()
    accessToken = await jwt.sign(
          { email: "dev@example.com" },
          "foobarbaz",
          {
              expiresIn: '24 days'
          }
      );

    otherUserAccessToken = await jwt.sign(
        { email: "other@example.com" },
        "foobarbaz",
        {
            expiresIn: '24 days'
        }
    );

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Create test list
    let resp = await request(app.getHttpServer()).get('/list').set("Authorization", `Bearer ${accessToken}`)
    listId = resp.body[0].id;
  });


  it("Other user can't update list name", () => {
    return request(app.getHttpServer())
      .put(`/list/${listId}`)
      .set("Authorization", `Bearer ${otherUserAccessToken}`)
      .send({"name": "my new list"})
      .expect(403)
  })


  it("User can create a new list", () => {
    return request(app.getHttpServer())
      .post(`/list`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({"name": "second list"})
      .expect(200)
      .expect((response) => expect(response.body.name).toEqual("second list"))
      .then(() => {
        return request(app.getHttpServer()).get('/list')
          .set("Authorization", `Bearer ${accessToken}`)
          .expect(200)
          .expect((res) => res.body.length === 2)
      })
  })


  it("User cannot create a list without a name", () => {
    return request(app.getHttpServer())
      .post(`/list`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({"name": ""})
      .expect(400)
      .expect((resp) => expect(resp.body).toEqual({
        'error': 'emptyName',
        'message': "A list name must be provided"
      }))
  })


  it("User can delete a list", () => {
    return request(app.getHttpServer())
      .delete(`/list/${listId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(204)
      .then(() => {
        // retrieve lists again and assert that it has been removed
        return request(app.getHttpServer()).get('/list')
          .set("Authorization", `Bearer ${accessToken}`)
          .expect(200)
          .expect((resp) => {
            expect(resp.body).not.toEqual(
              expect.arrayContaining([
                expect.objectContaining({
                  id: listId
                })
              ])
            );
          })
      })
  })

  it("Other user can't delete the list", () => {

    return request(app.getHttpServer())
      .delete(`/list/${listId}`)
      .set("Authorization", `Bearer ${otherUserAccessToken}`)
      .expect(403)
  })

  it('List owner can see they own the list', () => {
    return request(app.getHttpServer())
      .get(`/list/${listId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200)
      .expect((resp) => {
        expect(resp.body.isOwner).toEqual(true)
      })
  })
  
  it('User can see they do not own the list', () => {
    return request(app.getHttpServer())
      .get(`/list/${listId}`)
      .set("Authorization", `Bearer ${otherUserAccessToken}`)
      .expect(200)
      .expect((resp) => {
        expect(resp.body.isOwner).toEqual(false)
      })
  })

});
