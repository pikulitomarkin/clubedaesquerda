import { Module } from "@nestjs/common";
import { EventsController } from "./events.controller";
import { EventsService } from "./events.service";
import { EventoCleanupJob } from "./evento-cleanup.job";

@Module({
  controllers: [EventsController],
  providers: [EventsService, EventoCleanupJob],
  exports: [EventsService],
})
export class EventsModule {}
