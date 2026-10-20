
import 'reflect-metadata';
import 'dotenv/config';

import { DataSource } from 'typeorm';
import { databaseEntities } from './database.config.js';

const databaseUrl = 'postgresql://neondb_owner:npg_WFZ6r1oQDqPC@ep-hidden-butterfly-b7mhk6qe-pooler.c-13.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

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
