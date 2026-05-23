import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EnvKind } from '@prisma/client';

export class TriggerRolloutDto {
  @ApiProperty({ enum: EnvKind, example: EnvKind.DEV })
  @IsEnum(EnvKind)
  environment!: EnvKind;
}
