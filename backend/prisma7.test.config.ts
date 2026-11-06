import { defineConfig } from '@prisma/prisma7/config'
import { getTestDatabaseUrl } from './src/config/test-database.js'

const databaseUrl = getTestDatabaseUrl()

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: databaseUrl,
  },
})
