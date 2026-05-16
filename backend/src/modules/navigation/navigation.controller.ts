import { Controller, Get, Query } from '@nestjs/common';
import { NavigationService } from './navigation.service';
import { Public } from '@/common/guards/jwt-auth.guard';

@Controller({ path: 'navigation', version: '1' })
export class NavigationController {
  constructor(private readonly service: NavigationService) {}

  @Public()
  @Get()
  list(@Query('location') location = 'primary') { return this.service.list(location); }
}
