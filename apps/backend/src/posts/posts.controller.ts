import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  ForbiddenException,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { Post as PostEntity, User } from '@prisma/client';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Permissions('posts:create')
  create(
    @Body() createPostDto: CreatePostDto,
    @CurrentUser() user: User,
  ): Promise<PostEntity> {
    return this.postsService.create(createPostDto, user.id);
  }

  @Public()
  @Get()
  @HttpCode(HttpStatus.OK)
  findAll(): Promise<PostEntity[]> {
    return this.postsService.findAll();
  }

  @Public()
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  findOne(@Param('id', ParseIntPipe) id: number): Promise<PostEntity> {
    return this.postsService.findOne(id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @Permissions('posts:update')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePostDto: UpdatePostDto,
    @CurrentUser() user: User,
  ): Promise<PostEntity> {
    const post = await this.postsService.findOne(id);
    const userRoles = (user as any).roles?.map((ur: any) => ur.role.name) || [];

    if (post.authorId !== user.id && !userRoles.includes('ADMIN')) {
      throw new ForbiddenException('You can only update your own posts');
    }

    return this.postsService.update(id, updatePostDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions('posts:delete')
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ): Promise<void> {
    const post = await this.postsService.findOne(id);
    const userRoles = (user as any).roles?.map((ur: any) => ur.role.name) || [];

    if (post.authorId !== user.id && !userRoles.includes('ADMIN')) {
      throw new ForbiddenException('You can only delete your own posts');
    }

    await this.postsService.remove(id);
  }
}
