import { Knex, knex as setupKnex } from 'knex'

export const config: Knex.Config = {
  client: 'sqlite',
  connection: {
    filename: './src/infra/knex/app.db'
  },
  migrations: {
    extension: 'ts',
    directory: './src/infra/knex/migrations'
  },
  useNullAsDefault: true
}

export const knex = setupKnex(config)