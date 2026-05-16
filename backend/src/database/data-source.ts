import 'reflect-metadata';
import { config as loadEnv } from 'dotenv';
import { DataSource, DataSourceOptions } from 'typeorm';
import { join } from 'path';

loadEnv();
loadEnv({ path: '.env.local', override: true });

const isTs = __filename.endsWith('.ts');

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  synchronize: false,
  migrationsRun: false,
  entities: [
    join(__dirname, '..', 'modules', '**', 'entities', '*.entity.' + (isTs ? 'ts' : 'js')),
    join(__dirname, '..', 'core', '**', 'entities', '*.entity.' + (isTs ? 'ts' : 'js')),
  ],
  migrations: [join(__dirname, 'migrations', '*.' + (isTs ? 'ts' : 'js'))],
  extra: { max: Number(process.env.DB_POOL_MAX ?? 20) },
};

export const AppDataSource = new DataSource(dataSourceOptions);
