import { IsString, MaxLength, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePostDto {
  @ApiPropertyOptional({
    description: 'The title of the post',
    example: 'Updated Post Title',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({
    description: 'The content of the post',
    example: 'This is the updated content.',
  })
  @IsOptional()
  @IsString()
  content?: string;
}
