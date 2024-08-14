import { ApiProperty } from '@nestjs/swagger';

export class tokenDto {
  @ApiProperty({
    required: true,
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhMzc3MzVmMS0wZDkyLTRhYzAtYjliNC00ZjdhMmY5YmFlMDIiLCJ0b2tlblR5cGUiOiJhY2Nlc3MiLCJpYXQiOjE3MjM2MDQzNTcsImV4cCI6MTcyMzY5MDc1N30.sDfDJBDHzzHaiAKlGOitJ4gqjL2Qtd2iLucljXd2ClM',
  })
  token: string;
}
