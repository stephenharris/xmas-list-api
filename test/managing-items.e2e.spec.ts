import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import {createTable} from './create-table';
var jwt = require('jsonwebtoken');

describe('Adding/removing items', () => {
  let app;
  let accessToken;
  let otherUserAccessToken;
  let listId
  
  beforeEach(async () => {
    
    await createTable()
    console.log("?");
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

  it('Can retrieve, add/remove items and update list', () => {
    return request(app.getHttpServer())
      // retrieve list
      .get('/list')
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200)
      .expect((res) => res.body.length === 1)
      .then((res) => res.body[0].id)
      .then(async (listId) => {

        // Create item
        let resp = await request(app.getHttpServer()).post(`/list/${listId}/item`).set("Authorization", `Bearer ${accessToken}`).send({'description': 'foo'})
        expect(resp.status).toEqual(200)
        expect(resp.body.item).toEqual("foo")

        //Create second item
        let resp2 = await request(app.getHttpServer()).post(`/list/${listId}/item`).set("Authorization", `Bearer ${accessToken}`).send({'description': 'bar'})
        
        // Delete first item
        let fooItemUuid = resp.body.uuid;
        let barItemUuid = resp2.body.uuid;
        resp = await request(app.getHttpServer()).delete(`/list/${listId}/item/${fooItemUuid}`).set("Authorization", `Bearer ${accessToken}`)
        expect(resp.status).toEqual(204)

        // Update meta data
        resp = await request(app.getHttpServer()).put(`/list/${listId}`).set("Authorization", `Bearer ${accessToken}`).send({"name": "my new list"})
        expect(resp.status).toEqual(200)

        // Asert list looks coorect
        await request(app.getHttpServer())
          .get(`/list/${listId}`)
          .set("Authorization", `Bearer ${accessToken}`)
          .expect(200)
          .expect((resp) => resp.body.listId == listId)
          .expect((resp) => resp.body.name == "my new list")
          .expect((resp) => expect(resp.body.items).toEqual([
            {
              "id": barItemUuid,
              "description": "bar"
            }
          ]));

        return request(app.getHttpServer())
          .get(`/list`)
          .set("Authorization", `Bearer ${accessToken}`)
          .expect(200)
          .expect((resp) => expect(resp.body).toEqual([
            {
              "name": "my new list",
              "id": listId
            }
          ]))

      })
      
  });

  it("Other user can't add item", () => {
    return request(app.getHttpServer())
      .post(`/list/${listId}/item`)
      .set("Authorization", `Bearer ${otherUserAccessToken}`)
      .send({'description': 'baz'})
      .expect(403)
  })


  it("Other user can't delete item", () => {

    return request(app.getHttpServer())
      .post(`/list/${listId}/item`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({'description': 'foo'})
      .expect(200)
      .then((resp) => {
        let fooItemUuid = resp.body.uuid;
        return request(app.getHttpServer())
          .delete(`/list/${listId}/item/${fooItemUuid}`)
          .set("Authorization", `Bearer ${otherUserAccessToken}`)
          .send({'description': 'baz'})
          .expect(403)
      })
  })

});
