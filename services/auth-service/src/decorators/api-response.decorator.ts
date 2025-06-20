import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';

export function ApiResponse() {
  return applyDecorators(
    Transform(({ value }) => value, { toPlainOnly: true })
  );
}