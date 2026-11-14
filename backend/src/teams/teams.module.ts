import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { R2StorageService } from '../storage/r2-storage.service';
import { TeamsController } from './teams.controller';
import { TeamsService } from './teams.service';

@Module({
  imports: [AuthModule],
  controllers: [TeamsController],
  providers: [TeamsService, R2StorageService],
  exports: [TeamsService],
})
export class TeamsModule {}

