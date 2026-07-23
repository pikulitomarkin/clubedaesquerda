import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";
import { PrismaModule } from "./modules/common/prisma/prisma.module";
import { BlocksModule } from "./modules/common/blocks/blocks.module";
import { StorageModule } from "./modules/common/storage/storage.module";
import { RealtimeModule } from "./modules/realtime/realtime.module";
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { ProfilesModule } from "./modules/profiles/profiles.module";
import { BandeirasModule } from "./modules/bandeiras/bandeiras.module";
import { InteressesModule } from "./modules/interesses/interesses.module";
import { FriendshipsModule } from "./modules/friendships/friendships.module";
import { MatchesModule } from "./modules/matches/matches.module";
import { ChatsModule } from "./modules/chats/chats.module";
import { RodasModule } from "./modules/rodas/rodas.module";
import { MesasModule } from "./modules/mesas/mesas.module";
import { PostsModule } from "./modules/posts/posts.module";
import { ReactionsModule } from "./modules/reactions/reactions.module";
import { EventsModule } from "./modules/events/events.module";
import { HomenagensModule } from "./modules/homenagens/homenagens.module";
import { ReportsModule } from "./modules/reports/reports.module";
import { UploadsModule } from "./modules/uploads/uploads.module";
import { EmojisModule } from "./modules/emojis/emojis.module";
import { GifsModule } from "./modules/gifs/gifs.module";
import { SugestoesModule } from "./modules/sugestoes/sugestoes.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot({ throttlers: [{ ttl: 60_000, limit: 100 }] }),
    PrismaModule,
    BlocksModule,
    StorageModule,
    RealtimeModule,
    AuthModule,
    UsersModule,
    ProfilesModule,
    BandeirasModule,
    InteressesModule,
    FriendshipsModule,
    MatchesModule,
    ChatsModule,
    RodasModule,
    MesasModule,
    PostsModule,
    ReactionsModule,
    EventsModule,
    HomenagensModule,
    ReportsModule,
    UploadsModule,
    EmojisModule,
    GifsModule,
    SugestoesModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
