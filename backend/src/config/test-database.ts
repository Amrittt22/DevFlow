import { config as loadDotenv } from 'dotenv'
import { fileURLToPath } from 'node:url'

const testEnvPath = fileURLToPath(new URL('../../.env.test', import.meta.url))

export function getTestDatabaseUrl() {
  loadDotenv({
    path: testEnvPath,
    override: true,
  })

  const databaseUrl = process.env.TEST_DATABASE_URL

  if (!databaseUrl) {
    throw new Error(
      'TEST_DATABASE_URL must be set in backend/.env.test before running tests',
    )
  }

  let parsedDatabaseUrl: URL

  try {
    parsedDatabaseUrl = new URL(databaseUrl)
  } catch {
    throw new Error('TEST_DATABASE_URL must be a valid PostgreSQL connection URL')
  }

  const databaseName = parsedDatabaseUrl.pathname.slice(1)
  const isSafeTestDatabase =
    parsedDatabaseUrl.protocol === 'postgresql:' &&
    (parsedDatabaseUrl.hostname === 'localhost' ||
      parsedDatabaseUrl.hostname === '127.0.0.1') &&
    databaseName === 'devflow_test'

  if (!isSafeTestDatabase) {
    throw new Error(
      'Refusing test database access: TEST_DATABASE_URL must target localhost or 127.0.0.1 and database devflow_test',
    )
  }

  return databaseUrl
}
