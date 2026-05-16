import { Controller, Get } from '@nestjs/common';
import { BrandingService } from './branding.service';
import { Public } from '@/common/guards/jwt-auth.guard';

@Controller({ path: 'branding', version: '1' })
export class BrandingController {
  constructor(private readonly service: BrandingService) {}

  @Public()
  @Get()
  all() { return this.service.all(); }
}
