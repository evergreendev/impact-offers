import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'roles', 'companies'],
  },
  auth: true,
  fields: [
    // Email added by default
    {
      name: 'roles',
      type: 'select',
      hasMany: true,
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Super Admin', value: 'superadmin' },
      ],
      defaultValue: ['admin'],
      required: true,
    },
    {
      name: 'companies',
      type: 'relationship',
      relationTo: 'companies',
      hasMany: true,
      required: false,
      admin: {
        description: 'Companies this user can manage and view.',
      },
    },
  ],
}
