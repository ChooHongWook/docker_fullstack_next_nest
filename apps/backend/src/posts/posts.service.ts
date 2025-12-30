import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Post } from '@prisma/client';

@Injectable()
export class PostsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createPostDto: CreatePostDto): Promise<Post> {
    return this.prisma.post.create({
      data: createPostDto,
    });
  }

  async findAll(): Promise<Post[]> {
    return this.prisma.post.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: number): Promise<Post> {
    const post = await this.prisma.post.findUnique({
      where: { id },
    });

    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    return post;
  }

  async update(id: number, updatePostDto: UpdatePostDto): Promise<Post> {
    await this.findOne(id);

    return this.prisma.post.update({
      where: { id },
      data: updatePostDto,
    });
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id);
    await this.prisma.post.delete({
      where: { id },
    });
  }
}
