import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { StepTypes } from '../enums/steps.enum';
import { dtoTrimWhitespace } from '../utils/dto-trim-whitespace';
import { isNotWhiteSpaceOnly } from '../utils/is-not-white-space-only';

export class StepsDto {
  @ApiProperty()
  @IsNotEmpty({ message: 'validation.NOT_EMPTY' })
  @IsString({ message: 'validation.INVALID_STRING' })
  @isNotWhiteSpaceOnly({ message: 'validation.INVALID_STRING' })
  @Transform(dtoTrimWhitespace)
  id: string;

  @ApiProperty({ enum: StepTypes })
  @IsNotEmpty({ message: 'validation.NOT_EMPTY' })
  @IsEnum(StepTypes, {
    message: `$property must be a valid enum value ${Object.values(StepTypes)}`,
  })
  type: StepTypes;

  @ApiProperty({
    required: false,
    isArray: true,
    type: String,
  })
  @IsOptional()
  @IsArray({ message: 'validation.INVALID_ARRAY' })
  next: string[];

  @ApiProperty()
  @IsOptional()
  @IsObject()
  config: any;
}
