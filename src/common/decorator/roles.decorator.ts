import { SetMetadata } from '@nestjs/common';
import { Role } from 'src/user/enum/role.enum';

export const IS_ROLES_KEY = 'role key';

export const Roles = (...roles: Role[]) => SetMetadata(IS_ROLES_KEY, roles);
