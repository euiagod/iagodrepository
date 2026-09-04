import pg from 'pg'
import 'dotenv/config'

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
})

pool.on('error', (err: Error) => {
  console.error('Erro inesperado no pool do Postgres', err)
})
