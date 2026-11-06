import { getTestDatabaseUrl } from '../config/test-database.js'

process.env.NODE_ENV = 'test'
getTestDatabaseUrl()
