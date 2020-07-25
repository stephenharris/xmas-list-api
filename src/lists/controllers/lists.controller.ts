import { Controller, Get, Query, Post, Body, Put, Param, Delete, HttpCode, UseGuards } from '@nestjs/common';
import { ItemService } from '../services/items.service';
import { BadRequestException, ForbiddenException, NotFoundException} from '@nestjs/common';
import {User} from '../../user.dectorator';
import { AuthGuard } from '../../auth.guard';

@Controller()
@UseGuards(AuthGuard)
export class ListItemsController {

  constructor(private readonly itemService: ItemService) {}

  @Post('list-item')
  @HttpCode(200)
  async createItem(@Body() body, @User() user: any) {
    console.log(`${user} created item `, body);

    if(!body.description) {
      throw new BadRequestException({
        'error': 'emptyDescription',
        'message': "Item description cannot be empty"
      });
    }

    try {
        let itemUuid = await this.itemService.addToList(body.description, user);
        return {
          'item': body.description,
          'uuid': itemUuid
        };
    } catch (error) {
        console.log("error", error);
        throw error;   
    }
  }

  @Delete('list-item/:uuid/')
  @HttpCode(204)
  async deleteItem(@Param('uuid') itemUuid: string, @User() user) {
    await this.itemService.removeItemFromList(itemUuid, user);
  }

  @Get('list-item/mine')
  @HttpCode(200)
  async getMyList(@User() user: any) {
    try {
      return this.itemService.getList(user).then(list => {
        return {
          items: list.items ? list.items.map((item) => {
            delete item['boughtBy'];
            return item;
          }): [],
          name: list.name,
          listId: user
        }
      });
    } catch (error) {
        console.log("error", error);
        throw error;   
    }
  }

  @Get('list-item/:listUuid')
  @HttpCode(200)
  async getList(@Param('listUuid') listUuid: string, @User() userUuid) {

    if(userUuid === listUuid) {
      throw new ForbiddenException('You cannot get your own list');
    }

    try {
        return this.itemService.getList(listUuid).then(list => {

          if(!list) {
            throw new NotFoundException({
              "message": "List could not be found",
              "code": "listNotFound"
            });
          }

          return {
            items: list.items.map((item) => {
              let boughtBy = null;
              if(item['boughtBy']) {
                boughtBy = (item['boughtBy'] === userUuid ? 'you' : 'someonelse');
              }
              item['boughtBy'] = boughtBy;
              return item;
            }),
            listId: listUuid,
            name: list.name
          }
        });
    } catch (error) {
        console.log("error", error);
        throw error;   
    }
  }

  @Post('mark-item/:listUuid/:itemUuid')
  @HttpCode(200)
  async updateItem(@Param('listUuid') listUuid: string, @Param('itemUuid') itemUuid: string, @User() userUuid) {

    if(userUuid === listUuid) {
      throw new ForbiddenException('You cannot mark items on your own list');
    }

    return this.itemService.markItemAsBought(listUuid, itemUuid, userUuid)
    .then((item) => {
      return item;
    })
    .catch((error) => {
      if(error.code === 'ConditionalCheckFailedException') {
        throw new ForbiddenException({
          'error': 'cannotMarkItem',
          'message': "This item is already marked as bought"
        }); 
      } else {
        throw error;
      }
    });
  }


  @Delete('mark-item/:listUuid/:itemUuid')
  @HttpCode(200)
  async removeMarkItemAsBought(@Param('listUuid') listUuid: string, @Param('itemUuid') itemUuid: string, @User() userUuid) {
    
    if(userUuid === listUuid) {
      throw new ForbiddenException('You cannot mark items on your own list');
    }

    return this.itemService.unmarkItemAsBought(listUuid, itemUuid, userUuid)
      .then((item) => {
        return item;
      })
      .catch((error) => {
        if(error.code === 'ConditionalCheckFailedException') {
          throw new ForbiddenException({
            'error': 'cannotUnmarkItem',
            'message': "This item is not marked as bought by you for you to unmark"
          }); 
        } else {
          throw error;
        }
      });
    //return item;
  }




}
