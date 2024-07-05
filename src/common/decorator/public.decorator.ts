import { SetMetadata } from '@nestjs/common';

export const PUBLIC_KEY = 'It is public';
export const Public = () => SetMetadata(PUBLIC_KEY, true);
