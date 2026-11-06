import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/prisma/client.js'
import { getTestDatabaseUrl } from './test-database.js'

const connectionString =
  process.env.NODE_ENV === 'test'
    ? getTestDatabaseUrl()
    : process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL must be set in the backend environment')
}

const adapter = new PrismaPg({
  connectionString,
})

export const prisma = new PrismaClient({ adapter })
