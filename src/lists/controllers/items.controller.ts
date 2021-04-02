import { Controller, Get, Query, Post, Body, Put, Param, Delete, HttpCode, UseGuards } from '@nestjs/common';
import { ItemService } from '../services/items.service';
import { BadRequestException, ForbiddenException, NotFoundException} from '@nestjs/common';
import {User} from '../../user.dectorator';
import { AuthGuard } from '../../auth.guard';

@Controller()
@UseGuards(AuthGuard)
export class ItemsController {

  constructor(private readonly itemService: ItemService) {}

  @Post('list/:listId/item')
  @HttpCode(200)
  async createItem(@Param('listId') listId: string, @Body() body, @User() user: any) {

    if(!body.description) {
      throw new BadRequestException({
        'error': 'emptyDescription',
        'message': "Item description cannot be empty"
      });
    }

    if(await this.itemService.userOwnsList(user, listId).then((owns) => !owns)) {
      throw new ForbiddenException('You cannot edit this list ');
    }

    try {
        let itemUuid = await this.itemService.addToList(body.description, listId);
        return {
          'item': body.description,
          'uuid': itemUuid
        };
    } catch (error) {
        console.log("error", error);
        throw error;   
    }
  }

  @Delete('list/:listId/item/:itemUuid/')
  @HttpCode(204)
  async deleteItem(@Param('listId') listId: string, @Param('itemUuid') itemUuid: string, @User() user) {

    if(await this.itemService.userOwnsList(user, listId).then((owns) => !owns)) {
      throw new ForbiddenException('You cannot edit this list ');
    }
    await this.itemService.removeItemFromList(itemUuid, listId);
  }

  @Post('list/:listId/item/:itemUuid/mark')
  @HttpCode(200)
  async markItem(@Param('listId') listId: string, @Param('itemUuid') itemUuid: string, @User() userUuid) {

    if(await this.itemService.userOwnsList(userUuid, listId)) {
      throw new ForbiddenException('You cannot mark items on your own list');
    }

    return this.itemService.markItemAsBought(listId, itemUuid, userUuid)
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

  @Delete('list/:listId/item/:itemUuid/mark')
  @HttpCode(200)
  async removeMarkItemAsBought(@Param('listId') listId: string, @Param('itemUuid') itemUuid: string, @User() userUuid) {
    
    if(await this.itemService.userOwnsList(userUuid, listId)) {
      throw new ForbiddenException('You cannot unmark items on your own list');
    }

    return this.itemService.unmarkItemAsBought(listId, itemUuid, userUuid)
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
