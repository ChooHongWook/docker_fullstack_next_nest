import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Post } from '@prisma/client';

@Injectable()
export class PostsService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectPinoLogger(PostsService.name)
    private readonly logger: PinoLogger,
  ) {}

  async create(createPostDto: CreatePostDto, authorId: string): Promise<Post> {
    this.logger.info({ authorId, title: createPostDto.title }, 'Creating post');
    const post = await this.prisma.post.create({
      data: {
        ...createPostDto,
        authorId,
      },
    });
    this.logger.info({ postId: post.id }, 'Post created successfully');
    return post;
  }

  async findAll(): Promise<Post[]> {
    this.logger.debug('Fetching all posts');
    const posts = await this.prisma.post.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
    this.logger.debug({ count: posts.length }, 'Posts fetched');
    return posts;
  }

  async findOne(id: number): Promise<Post> {
    this.logger.debug({ postId: id }, 'Fetching post');
    const post = await this.prisma.post.findUnique({
      where: { id },
    });

    if (!post) {
      this.logger.warn({ postId: id }, 'Post not found');
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    return post;
  }

  async update(id: number, updatePostDto: UpdatePostDto): Promise<Post> {
    this.logger.info({ postId: id, updates: updatePostDto }, 'Updating post');
    await this.findOne(id);

    const post = await this.prisma.post.update({
      where: { id },
      data: updatePostDto,
    });
    this.logger.info({ postId: id }, 'Post updated successfully');
    return post;
  }

  async remove(id: number): Promise<void> {
    this.logger.info({ postId: id }, 'Deleting post');
    await this.findOne(id);
    await this.prisma.post.delete({
      where: { id },
    });
    this.logger.info({ postId: id }, 'Post deleted successfully');
  }
}
