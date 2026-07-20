import { IsIn, IsOptional, IsString, MaxLength } from "class-validator";
import { ReportStatus } from "@clube/database";

export class ResolveReportDto {
  @IsIn(["IN_REVIEW", "RESOLVED", "DISMISSED"] satisfies ReportStatus[])
  status!: Extract<ReportStatus, "IN_REVIEW" | "RESOLVED" | "DISMISSED">;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  resolutionNote?: string;
}
