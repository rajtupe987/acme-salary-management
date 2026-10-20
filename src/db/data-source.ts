
import 'reflect-metadata';
import 'dotenv/config';

import { DataSource } from 'typeorm';
import { databaseEntities } from './database.config.js';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is missing in .env');
}

const AppDataSource = new DataSource({
  type: 'postgres',
  url: databaseUrl,

  entities: databaseEntities,

  migrations: ['src/db/migrations/*.ts'],

  migrationsTableName: 'typeorm_migrations',

  synchronize: false,
  migrationsRun: false,
  logging: true,
});

export default AppDataSource;
