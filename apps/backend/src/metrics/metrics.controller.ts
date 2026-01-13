import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { PrometheusController } from '@willsoto/nestjs-prometheus';
import { Public } from '../auth/decorators/public.decorator';

@Controller()
export class MetricsController extends PrometheusController {
  @Public()
  @Get('/metrics')
  async index(@Res({ passthrough: true }) response: Response) {
    return super.index(response);
  }
}
