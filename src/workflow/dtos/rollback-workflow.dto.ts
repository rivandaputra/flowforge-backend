import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { isNotWhiteSpaceOnly } from '../utils/is-not-white-space-only';
import { dtoTrimWhitespace } from '../utils/dto-trim-whitespace';
import { Transform } from 'class-transformer';

export class RollbackWorkflowDto {
  @ApiProperty()
  @IsNotEmpty({ message: 'validation.NOT_EMPTY' })
  @IsString({ message: 'validation.INVALID_STRING' })
  @isNotWhiteSpaceOnly({ message: 'validation.INVALID_STRING' })
  @Transform(dtoTrimWhitespace)
  id: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'validation.NOT_EMPTY' })
  @IsString({ message: 'validation.INVALID_STRING' })
  @isNotWhiteSpaceOnly({ message: 'validation.INVALID_STRING' })
  version_number: string;
}
