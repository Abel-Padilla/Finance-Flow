import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Put,
  Body,
  Req,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  Inject,
  Module,
} from "@nestjs/common";
import { AuthGuard, AuthModule, AuthRequest } from "./auth";
import { FinanceService } from "./finance.service";
import {
  AccountDto,
  CategoryDto,
  GoalDto,
  TransactionDto,
  BudgetDto,
  OnboardDto,
  QueryDto,
  SettingsDto,
} from "./dto";

@Controller("accounts")
@UseGuards(AuthGuard)
export class AccountsController {
  constructor(@Inject(FinanceService) private service: FinanceService) {}
  @Get() list(@Req() r: AuthRequest, @Query() _q: QueryDto) {
    return this.service.list("accounts", r.userId);
  }
  @Get(":id") get(
    @Req() r: AuthRequest,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.service.own("accounts", r.userId, id);
  }
  @Post() create(@Req() r: AuthRequest, @Body() d: AccountDto) {
    return this.service.save("accounts", r.userId, d);
  }
  @Patch(":id") update(
    @Req() r: AuthRequest,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() d: AccountDto,
  ) {
    return this.service.save("accounts", r.userId, d, id);
  }
  @Delete(":id") remove(
    @Req() r: AuthRequest,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.service.remove("accounts", r.userId, id);
  }
}

@Controller("categories")
@UseGuards(AuthGuard)
export class CategoriesController {
  constructor(@Inject(FinanceService) private service: FinanceService) {}
  @Get() list(@Req() r: AuthRequest, @Query() _q: QueryDto) {
    return this.service.list("categories", r.userId);
  }
  @Get(":id") get(
    @Req() r: AuthRequest,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.service.own("categories", r.userId, id);
  }
  @Post() create(@Req() r: AuthRequest, @Body() d: CategoryDto) {
    return this.service.save("categories", r.userId, d);
  }
  @Patch(":id") update(
    @Req() r: AuthRequest,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() d: CategoryDto,
  ) {
    return this.service.save("categories", r.userId, d, id);
  }
  @Delete(":id") remove(
    @Req() r: AuthRequest,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.service.remove("categories", r.userId, id);
  }
}

@Controller("savings-goals")
@UseGuards(AuthGuard)
export class SavingsGoalsController {
  constructor(@Inject(FinanceService) private service: FinanceService) {}
  @Get() list(@Req() r: AuthRequest, @Query() _q: QueryDto) {
    return this.service.list("savings-goals", r.userId);
  }
  @Get(":id") get(
    @Req() r: AuthRequest,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.service.own("savings-goals", r.userId, id);
  }
  @Post() create(@Req() r: AuthRequest, @Body() d: GoalDto) {
    return this.service.save("savings-goals", r.userId, d);
  }
  @Patch(":id") update(
    @Req() r: AuthRequest,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() d: GoalDto,
  ) {
    return this.service.save("savings-goals", r.userId, d, id);
  }
  @Delete(":id") remove(
    @Req() r: AuthRequest,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.service.remove("savings-goals", r.userId, id);
  }
}

@Controller("transactions")
@UseGuards(AuthGuard)
export class TransactionsController {
  constructor(@Inject(FinanceService) private service: FinanceService) {}
  @Get() list(@Req() r: AuthRequest, @Query() q: QueryDto) {
    return this.service.history(r.userId, q);
  }
  @Get(":id") get(
    @Req() r: AuthRequest,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.service.own("transactions", r.userId, id);
  }
  @Post() create(@Req() r: AuthRequest, @Body() d: TransactionDto) {
    return this.service.save("transactions", r.userId, d);
  }
  @Patch(":id") update(
    @Req() r: AuthRequest,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() d: TransactionDto,
  ) {
    return this.service.save("transactions", r.userId, d, id);
  }
  @Delete(":id") remove(
    @Req() r: AuthRequest,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.service.remove("transactions", r.userId, id);
  }
}

@Controller()
@UseGuards(AuthGuard)
export class PlanningController {
  constructor(@Inject(FinanceService) private service: FinanceService) {}
  @Get("budget") budget(@Req() r: AuthRequest) {
    return this.service.budget(r.userId);
  }
  @Put("budget") saveBudget(@Req() r: AuthRequest, @Body() d: BudgetDto) {
    return this.service.setBudget(r.userId, d);
  }
  @Post("users/onboarding") onboarding(
    @Req() r: AuthRequest,
    @Body() d: OnboardDto,
  ) {
    return this.service.onboarding(r.userId, d);
  }
  @Patch("users/settings") settings(
    @Req() r: AuthRequest,
    @Body() d: SettingsDto,
  ) {
    return this.service.settings(r.userId, d);
  }
  @Post("users/reset-onboarding") reset(@Req() r: AuthRequest) {
    return this.service.reset(r.userId);
  }
  @Get("dashboard/summary") summary(
    @Req() r: AuthRequest,
    @Query() q: QueryDto,
  ) {
    return this.service.dashboard(r.userId, q.month);
  }
  @Get("dashboard/cash-flow") async flow(
    @Req() r: AuthRequest,
    @Query() q: QueryDto,
  ) {
    return (await this.service.dashboard(r.userId, q.month)).cashFlowSeries;
  }
  @Get("dashboard/categories") async categories(
    @Req() r: AuthRequest,
    @Query() q: QueryDto,
  ) {
    return (await this.service.dashboard(r.userId, q.month)).categorySpending;
  }
  @Get("dashboard/insights") async insights(
    @Req() r: AuthRequest,
    @Query() q: QueryDto,
  ) {
    return (await this.service.dashboard(r.userId, q.month)).insights;
  }
}

@Module({
  imports: [AuthModule],
  providers: [FinanceService],
  controllers: [
    AccountsController,
    CategoriesController,
    SavingsGoalsController,
    TransactionsController,
    PlanningController,
  ],
})
export class FinanceModule {}
