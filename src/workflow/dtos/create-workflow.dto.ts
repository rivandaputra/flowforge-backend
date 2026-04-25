import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { StepsDto } from './steps.dto';
import { isNotWhiteSpaceOnly } from '../utils/is-not-white-space-only';
import { dtoTrimWhitespace } from '../utils/dto-trim-whitespace';
import { Transform, Type } from 'class-transformer';

export class CreateWorkflowDto {
  @ApiProperty()
  @IsNotEmpty({ message: 'validation.NOT_EMPTY' })
  @IsString({ message: 'validation.INVALID_STRING' })
  @isNotWhiteSpaceOnly({ message: 'validation.INVALID_STRING' })
  @Transform(dtoTrimWhitespace)
  name: string;

  @ApiProperty()
  @IsOptional()
  @IsString({ message: 'validation.INVALID_STRING' })
  @isNotWhiteSpaceOnly({ message: 'validation.INVALID_STRING' })
  version_number?: string;

  @ApiProperty({
    required: true,
    isArray: true,
    type: StepsDto,
  })
  @IsArray({ message: 'validation.INVALID_ARRAY' })
  @ValidateNested({ each: true })
  @Type(() => StepsDto)
  steps: StepsDto[];
}
