import { Module, forwardRef } from '@nestjs/common';
import { ServicesController } from './services.controller';
import { ServicesService } from './services.service';
import { GeneratorModule } from '../generator/generator.module';

/**
 * Service CRUD + ServiceVersion management.
 * Controller delegates to GeneratorService for artifact generation.
 */
@Module({
  imports: [forwardRef(() => GeneratorModule)],
  controllers: [ServicesController],
  providers: [ServicesService],
  exports: [ServicesService],
})
export class ServicesModule {}
