import { Controller, Get } from "@nestjs/common";
import { BandeirasService } from "./bandeiras.service";

@Controller("bandeiras")
export class BandeirasController {
  constructor(private readonly bandeirasService: BandeirasService) {}

  @Get()
  findAll() {
    return this.bandeirasService.findAllActive();
  }
}
