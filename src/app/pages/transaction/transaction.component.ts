import { Component, OnInit } from '@angular/core';
import { map } from 'rxjs/operators';
import { Breakpoints, BreakpointObserver } from '@angular/cdk/layout';
import { TransactionService } from '../_services';
import { FormControl, FormGroup } from '@angular/forms';
import { IBarChart, ILineChart } from 'src/app/shared/_interface';
import * as moment from 'moment';

@Component({
  selector: 'app-transaction',
  templateUrl: './transaction.component.html',
  styleUrls: ['./transaction.component.scss'],
})
export class TransactionComponent implements OnInit {
  errorMessage: string;

  gridLayout = this.breakpointObserver
    .observe([Breakpoints.Handset, Breakpoints.Tablet])
    .pipe(
      map(({ matches }) => {
        if (matches) {
          return {
            columns: 12,
            control: { cols: 12, rows: 8 },
            lineChart: { cols: 12, rows: 4 },
            barChart: { cols: 12, rows: 33 },
          };
        }

        return {
          columns: 12,
          control: { cols: 4, rows: 8 },
          lineChart: { cols: 8, rows: 4 },
          barChart: { cols: 12, rows: 20 },
        };
      })
    );

  dateRange = new FormGroup({
    start: new FormControl(),
    end: new FormControl(),
  });

  totalTransactionTitle: string = 'Total Transaction';
  totalTransactionData: ILineChart[];

  totalAmountTitle = 'Total Amount';
  totalAmountData: ILineChart[];

  expenseTypeTitle = 'Expense Type';
  expenseTypeData: IBarChart[];

  expenseAreas: string[] = [];
  selectedExpenseAreaOptions: string[] = [];
  selectedSliceOptions: number[] = [];
  sliceNumber: number[] = [];
  eventFireChecker: number;

  constructor(
    private breakpointObserver: BreakpointObserver,
    private transactionService: TransactionService
  ) {}

  ngOnInit(): void {
    this.createOrUpdateCharts();
    this.getExpenseArea();

    this.sliceNumber = [...Array(100).keys()];
  }

  onExpenseAreaChange(event: string[]) {
    this.getDailyTotalTransaction(event, this.dateRange.value);
    this.getDailyTotalAmount(event, this.dateRange.value);
    this.groupByExpenseType(event, this.dateRange.value);
  }

  onSliceChange(event: number[]) {
    this.createOrUpdateCharts();
  }

  onDateChange(
    dateRangeStart: HTMLInputElement,
    dateRangeEnd: HTMLInputElement
  ) {
    if (dateRangeStart.value) {
      dateRangeStart.value = moment(dateRangeStart.value, 'MM/DD//YYYY').format(
        'DD/MM/YYYY'
      );
    }

    if (dateRangeEnd.value) {
      dateRangeEnd.value = moment(dateRangeEnd.value, 'MM/DD//YYYY').format(
        'DD/MM/YYYY'
      );
    }

    if (dateRangeStart.value && dateRangeEnd.value) {
      this.createOrUpdateCharts();
    }
  }

  createOrUpdateCharts() {
    this.getDailyTotalTransaction(
      this.selectedExpenseAreaOptions,
      this.dateRange.value
    );
    this.getDailyTotalAmount(
      this.selectedExpenseAreaOptions,
      this.dateRange.value
    );
    this.groupByExpenseType(
      this.selectedExpenseAreaOptions,
      this.dateRange.value
    );
  }

  groupByExpenseType(
    expenseAreas: string[],
    dateRange: { start: Date; end: Date }
  ) {
    this.transactionService
      .groupByExpenseType(expenseAreas, dateRange)
      .subscribe({
        next: (expenseType: IBarChart[]) => {
          this.expenseTypeData = expenseType.sort((a, b) => a.value - b.value);
          if (this.selectedSliceOptions.length > 0) {
            this.expenseTypeData = this.expenseTypeData.slice(
              this.selectedSliceOptions[0]
            );
          }
        },
        error: (err) => (this.errorMessage = err),
      });
  }

  getDailyTotalTransaction(
    expenseAreas: string[],
    dateRange: { start: Date; end: Date }
  ): void {
    this.transactionService
      .getDailyTotalTransaction(expenseAreas, dateRange)
      .subscribe({
        next: (totalTransaction) => {
          this.totalTransactionData = totalTransaction.sort(
            (a, b) => a.date.getTime() - b.date.getTime()
          );

          if (this.selectedSliceOptions.length > 0) {
            this.totalTransactionData = this.totalTransactionData.slice(
              this.selectedSliceOptions[0]
            );
          }
        },
        error: (err) => (this.errorMessage = err),
      });
  }

  getDailyTotalAmount(
    expenseAreas: string[],
    dateRange: { start: Date; end: Date }
  ): void {
    this.transactionService
      .getDailyTotalAmount(expenseAreas, dateRange)
      .subscribe({
        next: (totalAmount: ILineChart[]) => {
          this.totalAmountData = totalAmount.sort(
            (a, b) => a.date.getTime() - b.date.getTime()
          );
          if (this.selectedSliceOptions.length > 0) {
            this.totalAmountData = this.totalAmountData.slice(
              this.selectedSliceOptions[0]
            );
          }
        },
        error: (err) => (this.errorMessage = err),
      });
  }

  getExpenseArea() {
    this.transactionService.getExpenseArea().subscribe({
      next: (expenseAreas: string[]) => {
        this.expenseAreas = expenseAreas.sort();
      },
      error: (err) => (this.errorMessage = err),
    });
  }
}
