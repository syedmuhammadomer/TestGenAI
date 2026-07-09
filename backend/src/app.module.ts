import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import fs from 'fs';
import dotenv from 'dotenv';
import path from 'path';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { EmailService } from './auth/email.service';
import { User } from './auth/user.entity';
import { PendingRegistration } from './auth/pending-registration.entity';
import { ProjectsModule } from './projects/projects.module';
import { TeamModule } from './team/team.module';
import { TeamMember } from './team/entities/team-member.entity';

const envCandidates = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), 'backend/.env'),
  path.resolve(__dirname, '../.env'),
  path.resolve(__dirname, '../../.env'),
];

const loadedEnvPath = envCandidates.find((candidate) => fs.existsSync(candidate));

if (loadedEnvPath) {
  dotenv.config({ path: loadedEnvPath, override: true });
  console.log(`[env] loaded ${loadedEnvPath}`);
}

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    // TypeORM / Postgres configuration. Uses DATABASE_URL if provided,
    // otherwise falls back to individual env vars. `autoLoadEntities`
    // will automatically load entities registered by TypeORM modules.
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const logger = new Logger('DatabaseConfig');
        const databaseUrl = process.env.DATABASE_URL || configService.get<string>('DATABASE_URL');
        const isProd = configService.get<string>('NODE_ENV') === 'production';
        const sslSetting = configService.get<string>('DB_SSL');
        const sslRejectUnauthorized = configService.get<string>('DB_SSL_REJECT_UNAUTHORIZED');
        const ssl =
          sslSetting === 'true'
            ? { rejectUnauthorized: sslRejectUnauthorized !== 'false' }
            : sslSetting === 'false'
              ? false
              : undefined;

        logger.log(databaseUrl ? 'Using DATABASE_URL' : 'Using DB_* variables');

        if (databaseUrl) {
          return {
            type: 'postgres',
            url: databaseUrl,
            synchronize: !isProd,
            logging: !isProd,
            autoLoadEntities: true,
            ...(ssl !== undefined ? { ssl } : {}),
          } as any;
        }

        return {
          type: 'postgres',
          host: configService.get<string>('DB_HOST') || undefined,
          port: configService.get<number>('DB_PORT') ? Number(configService.get<number>('DB_PORT')) : undefined,
          username: configService.get<string>('DB_USER') || undefined,
          password: configService.get<string>('DB_PASS') || undefined,
          database: configService.get<string>('DB_NAME') || undefined,
          synchronize: !isProd, // enable in dev, disable in production
          logging: !isProd,
          autoLoadEntities: true,
          ...(ssl !== undefined ? { ssl } : {}),
        } as any;
      },
    }),

    TypeOrmModule.forFeature([User, PendingRegistration, TeamMember]),
    ProjectsModule,
    TeamModule,
  ],
  controllers: [AppController, AuthController],
  providers: [AppService, AuthService, EmailService],
})
export class AppModule {}
