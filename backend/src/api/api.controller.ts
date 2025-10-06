import { Body, Controller, Post } from '@nestjs/common';
import { ApiService } from './api.service';

@Controller('transactions')
export class ApiController {
  constructor(private readonly apiService: ApiService) {}

  @Post()
  async createTransaction(@Body() data: any) {
    return this.apiService.publishTransactionInitiated(data);
  }
}
