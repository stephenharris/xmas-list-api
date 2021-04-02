import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import {createTable} from './create-table';
var jwt = require('jsonwebtoken');

describe('Mark items', () => {
  let app;
  let accessToken;
  let listOwnerToken;
  let otherUserAccessToken;
  let listId;
  let itemA
  let itemB

  beforeEach(async () => {
    
    await createTable()
    listOwnerToken = await jwt.sign(
      { email: "listowner@example.com" },
      "foobarbaz",
      {
          expiresIn: '24 days'
      }
    );
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
    let resp = await request(app.getHttpServer()).get('/list').set("Authorization", `Bearer ${listOwnerToken}`)
    listId = resp.body[0].id;
    console.log(resp.body);
    console.log(`created list ${listId} owned by ${resp.body[0].owner}`)
    resp = await request(app.getHttpServer()).post(`/list/${listId}/item`).set("Authorization", `Bearer ${listOwnerToken}`).send({'description': 'item A'})
    itemA = resp.body.uuid;
    
    resp = await request(app.getHttpServer()).post(`/list/${listId}/item`).set("Authorization", `Bearer ${listOwnerToken}`).send({'description': 'iteam B'})
    itemB = resp.body.uuid;

    // Mark item
    await request(app.getHttpServer())
      .post(`/list/${listId}/item/${itemA}/mark`)
      .set("Authorization", `Bearer ${accessToken}`)

    console.log("===============================");
    console.log(`${listId}/${itemA}`)
      
  });


  it('User can see they bought it', () => {
    return request(app.getHttpServer())
      .get(`/list/${listId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200)
      .expect((resp) => {
        let item = resp.body.items.find((item) => item.id === itemA)
        expect(item.boughtBy).toEqual("you")
      })
  })

  it('List owner cannot see if item is bought or not', () => {
    return request(app.getHttpServer())
      .get(`/list/${listId}`)
      .set("Authorization", `Bearer ${listOwnerToken}`)
      .expect(200)
      .expect((resp) => {
        console.log(resp.body);
        let item = resp.body.items.find((item) => item.id === itemA)
        expect(item).not.toHaveProperty("boughtBy")
      })
  })

  it('Other user can see item bought but not by whom', () => {
    return request(app.getHttpServer())
      .get(`/list/${listId}`)
      .set("Authorization", `Bearer ${otherUserAccessToken}`)
      .expect(200)
      .expect((resp) => {
        console.log(resp.body);
        let item = resp.body.items.find((item) => item.id === itemA)
        expect(item.boughtBy).toEqual("someoneelse")
      })
  });


  it('Other user cannot mark already marked item', () => {
    return request(app.getHttpServer())
      .post(`/list/${listId}/item/${itemA}/mark`)
      .set("Authorization", `Bearer ${otherUserAccessToken}`)
      .expect(403)
  });

  it('Other user cannot unmark item', () => {
    return request(app.getHttpServer())
      .delete(`/list/${listId}/item/${itemA}/mark`)
      .set("Authorization", `Bearer ${otherUserAccessToken}`)
      .expect(403)
  });


  it('List owner cannot mark items', () => {
    return request(app.getHttpServer())
      .post(`/list/${listId}/item/${itemB}/mark`)
      .set("Authorization", `Bearer ${listOwnerToken}`)
      .expect(403)
  });

  it('List owner cannot unmark item', () => {
    return request(app.getHttpServer())
      .delete(`/list/${listId}/item/${itemA}/mark`)
      .set("Authorization", `Bearer ${listOwnerToken}`)
      .expect(403)
  });

  it('Original buyer can unmark item', () => {
    return request(app.getHttpServer())
      .delete(`/list/${listId}/item/${itemA}/mark`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200)
      .then(() => {
        return request(app.getHttpServer())
          .get(`/list/${listId}`)
          .set("Authorization", `Bearer ${accessToken}`)
          .expect(200)
          .expect((resp) => {
            console.log(resp.body);
            let item = resp.body.items.find((item) => item.id === itemA)
            expect(item.boughtBy).toEqual(null)
          })
      })
  });

  it('Cannot mark non-existant item', () => {
    return request(app.getHttpServer())
      .delete(`/list/${listId}/item/xxx${itemA}/mark`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(403)
  });

});
