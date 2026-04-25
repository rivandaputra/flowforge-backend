import {
  IsArray,
  IsInt,
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

export class RunWorkflowDto {
  @ApiProperty()
  @IsNotEmpty({ message: 'validation.NOT_EMPTY' })
  @IsString({ message: 'validation.INVALID_STRING' })
  @isNotWhiteSpaceOnly({ message: 'validation.INVALID_STRING' })
  @Transform(dtoTrimWhitespace)
  id: string;

  @ApiProperty({
    required: true,
    isArray: true,
    type: StepsDto,
  })
  @IsArray({ message: 'validation.INVALID_ARRAY' })
  @ValidateNested({ each: true })
  @Type(() => StepsDto)
  steps: StepsDto[];

  @ApiProperty()
  @IsOptional()
  @IsInt({ message: 'validation.INVALID_INT' })
  @Type(() => Number)
  max_error_retries?: number;
}
