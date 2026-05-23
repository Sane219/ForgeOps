import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'alice@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Alice Nguyen' })
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiProperty({ example: 'secureP@ss123' })
  @IsString()
  @MinLength(8)
  password!: string;
}
