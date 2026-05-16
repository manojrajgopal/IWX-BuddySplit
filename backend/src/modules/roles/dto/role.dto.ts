import { z } from 'zod';

export const permissionSchema = z.object({
  resource: z.string().min(1).max(60),
  action: z.string().min(1).max(40),
});

export const roleCreateSchema = z.object({
  name: z.string().min(2).max(60).regex(/^[a-z0-9_\-]+$/i, 'name may only contain letters, digits, underscore and dash'),
  description: z.string().max(500).optional().nullable(),
  permissions: z.array(permissionSchema).optional().default([]),
});

export const roleUpdateSchema = z.object({
  description: z.string().max(500).optional().nullable(),
  permissions: z.array(permissionSchema).optional(),
});

export type RoleCreateDto = z.infer<typeof roleCreateSchema>;
export type RoleUpdateDto = z.infer<typeof roleUpdateSchema>;
export type PermissionDto = z.infer<typeof permissionSchema>;
