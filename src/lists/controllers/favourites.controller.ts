import { Controller, Get, Query, Post, Body, Put, Param, Delete, HttpCode, UseGuards } from '@nestjs/common';
import { ItemService } from '../services/items.service';
import { BadRequestException, ForbiddenException, NotFoundException} from '@nestjs/common';
import {User} from '../../user.dectorator';
import { AuthGuard } from '../../auth.guard';

@Controller()
@UseGuards(AuthGuard)
export class FavouritesController {

  constructor(private readonly itemService: ItemService) {}

  @Post('favourites')
  @HttpCode(200)
  async createItem(@Body() body, @User() user: any) {
    console.log(`${user} created item `, body);

    if(!body.list) {
      throw new BadRequestException({
        'error': 'emptyUuid',
        'message': "Item description cannot be empty"
      });
    }

    try {
        await this.itemService.saveList(body.list, user);
        return {
          'list': body.list
        };
    } catch (error) {
        console.log("error", error);
        throw error;   
    }
  }

  @Delete('favourites/:uuid/')
  @HttpCode(204)
  async unfavouriteList(@Param('uuid') listUuid: string, @User() user) {
    await this.itemService.removeFromFavourites(listUuid, user);
  }

  @Get('favourites')
  @HttpCode(200)
  getFavouritedLists(@User() user: any) {
    try {
      return this.itemService.getFavourites(user).then(async lists => {
        return {
          lists: await Promise.all(lists.map(favourite => this.asyncGetList(favourite)))
        }
      });
    } catch (error) {
        console.log("error", error);
        throw error;   
    }
  }

  async asyncGetList(list) {
    let _list = await this.itemService.getList(list.uuid);
    list.name = _list.name;
    list.url = _list.url;
    return list;
  }


}
