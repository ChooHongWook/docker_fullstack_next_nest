import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('health')
@Controller()
export class AppController {
  @Get()
  @ApiOperation({ summary: 'Root health check' })
  @ApiResponse({
    status: 200,
    description: 'API status information',
  })
  getHealth() {
    return {
      status: 'ok',
      message: 'Posts API is running',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('health')
  @ApiOperation({ summary: 'Detailed health check' })
  @ApiResponse({
    status: 200,
    description: 'Detailed service health information including uptime',
  })
  healthCheck() {
    return {
      status: 'healthy',
      service: 'posts-api',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }
}
