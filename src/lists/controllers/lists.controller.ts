import { Controller, Get, Query, Post, Body, Put, Param, Delete, HttpCode, UseGuards } from '@nestjs/common';
import { ItemService } from '../services/items.service';
import { BadRequestException, ForbiddenException, NotFoundException} from '@nestjs/common';
import {User} from '../../user.dectorator';
import { AuthGuard } from '../../auth.guard';

@Controller()
@UseGuards(AuthGuard)
export class ListController {

  constructor(private readonly itemService: ItemService) {}

  // Lists
  @Get('list')
  @HttpCode(200)
  async getLists(@User() userUuid) {

    return this.itemService.getUsersLists(userUuid).then().catch((error) => {
      console.log("error", error);
      throw error;  
    })
  }

  @Put('list/:listId/')
  @HttpCode(200)
  async updateList(@Param('listId') listId: string, @Body() body, @User() userUuid: any) {
    try {
      if(await this.itemService.userOwnsList(userUuid, listId)) {
        return this.itemService.updateListMeta(listId, userUuid, body);
      }

      throw new ForbiddenException("You cannot update lists that are not your own");

    } catch (error) {
        console.log("error", error);
        throw error;   
    }
  }

  @Get('list/:listId')
  @HttpCode(200)
  async getList(@Param('listId') listId: string, @User() userUuid) {

    try {
        let ownsList = await this.itemService.userOwnsList(userUuid, listId);
        return this.itemService.getList(listId).then(list => {

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
                boughtBy = (item['boughtBy'] === userUuid ? 'you' : 'someoneelse');
              }
              item['boughtBy'] = boughtBy;
              if (ownsList) {
                delete item['boughtBy'];
              }
              return item;
            }),
            listId: listId,
            name: list.name,
            isOwner: ownsList
          }
        });
    } catch (error) {
        console.log("error", error);
        throw error;   
    }
  }

  @Post('list')
  @HttpCode(200)
  async createList(@Body() body, @User() userUuid: any) {
    try {
      
      if(!body.name) {
        throw new BadRequestException({
          'error': 'emptyName',
          'message': "A list name must be provided"
        });
      }
      return this.itemService.createList(userUuid, body.name)
        .then((listId) => {
          return {
            id: listId,
            name: body.name
          }
        })

    } catch (error) {
        console.log("error", error);
        throw error;   
    }
  }

  @Delete('list/:listId')
  @HttpCode(204)
  async deleteList(@Param('listId') listId: string, @Body() body, @User() userUuid: any) {
    try {

      return this.itemService.userOwnsList(userUuid, listId)
        .then((ownsList) => {
          if(!ownsList) {
            throw new ForbiddenException('You cannot delete this list');
          }
        })
        .then(() => this.itemService.deleteList(userUuid, listId))

    } catch (error) {
        console.log("error", error);
        throw error;   
    }
  }
}
