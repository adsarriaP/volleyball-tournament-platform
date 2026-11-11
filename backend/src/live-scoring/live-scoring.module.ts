import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MatchesModule } from '../matches/matches.module';
import { VolleyballEngineService } from '../volleyball-engine/volleyball-engine.service';
import { LiveScoringController } from './live-scoring.controller';
import { LiveScoringGateway } from './live-scoring.gateway';
import { LiveScoringService } from './live-scoring.service';

@Module({
  imports: [AuthModule, MatchesModule],
  controllers: [LiveScoringController],
  providers: [
    VolleyballEngineService,
    LiveScoringGateway,
    LiveScoringService,
  ],
  exports: [VolleyballEngineService, LiveScoringService, LiveScoringGateway],
})
export class LiveScoringModule {}
