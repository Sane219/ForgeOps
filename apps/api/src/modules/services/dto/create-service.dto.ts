import { IsArray, IsOptional, IsString, IsUrl, MaxLength, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateServiceDto {
  @ApiProperty({ example: 'acme-api' })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @ApiProperty({ example: 'acme-api' })
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  slug!: string;

  @ApiProperty({ example: 'nestjs-api' })
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  templateKey!: string;

  @ApiPropertyOptional({ example: 'Core REST API for the platform' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ example: 'https://github.com/acme/acme-api' })
  @IsOptional()
  @IsUrl()
  repoUrl?: string;

  @ApiPropertyOptional({ example: ['backend', 'api'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
