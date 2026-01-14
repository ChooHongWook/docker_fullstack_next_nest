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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiCookieAuth,
} from '@nestjs/swagger';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { Post as PostEntity, User } from '@prisma/client';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';

@ApiTags('posts')
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Permissions('posts:create')
  @ApiOperation({ summary: 'Create a new post' })
  @ApiCookieAuth('access_token')
  @ApiResponse({
    status: 201,
    description: 'Post created successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Missing permission' })
  create(
    @Body() createPostDto: CreatePostDto,
    @CurrentUser() user: User,
  ): Promise<PostEntity> {
    return this.postsService.create(createPostDto, user.id);
  }

  @Public()
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all posts' })
  @ApiResponse({
    status: 200,
    description: 'List of all posts',
  })
  findAll(): Promise<PostEntity[]> {
    return this.postsService.findAll();
  }

  @Public()
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a post by ID' })
  @ApiParam({ name: 'id', description: 'Post ID', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Post found',
  })
  @ApiResponse({ status: 404, description: 'Post not found' })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<PostEntity> {
    return this.postsService.findOne(id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @Permissions('posts:update')
  @ApiOperation({ summary: 'Update a post' })
  @ApiCookieAuth('access_token')
  @ApiParam({ name: 'id', description: 'Post ID', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Post updated successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Can only update own posts',
  })
  @ApiResponse({ status: 404, description: 'Post not found' })
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
  @ApiOperation({ summary: 'Delete a post' })
  @ApiCookieAuth('access_token')
  @ApiParam({ name: 'id', description: 'Post ID', type: Number })
  @ApiResponse({
    status: 204,
    description: 'Post deleted successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Can only delete own posts',
  })
  @ApiResponse({ status: 404, description: 'Post not found' })
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
