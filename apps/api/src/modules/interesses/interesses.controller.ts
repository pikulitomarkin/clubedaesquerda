import { Controller, Get } from "@nestjs/common";
import { InteressesService } from "./interesses.service";

@Controller("interesses")
export class InteressesController {
  constructor(private readonly interessesService: InteressesService) {}

  @Get()
  findAll() {
    return this.interessesService.findAllActive();
  }
}
