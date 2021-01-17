import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import * as d3 from 'd3';

import { Observable, throwError, from } from 'rxjs';
import {
  catchError,
  tap,
  map,
  reduce,
  groupBy,
  mergeMap,
  toArray,
  distinct,
  filter,
  shareReplay,
} from 'rxjs/operators';
import * as moment from 'moment';

import { ITransaction } from '../_interfaces';
import { IBarChart, ILineChart } from 'src/app/shared/_interface';
import { environment } from 'src/environments/environment';
import { LineChart } from 'src/app/shared/_models';

@Injectable({
  providedIn: 'root',
})
export class TransactionService {
  private apiUrl: string;
  private cacheData: Observable<ITransaction[]>;
  private cacheDuration: number;
  private cacheDate: Date;
  private cacheSize: number;

  parseDate = d3.timeParse('%d-%m-%Y');

  constructor(private http: HttpClient) {
    this.apiUrl = environment.apiUrl;
    this.cacheSize = environment.cacheSize;
    this.cacheDuration = environment.cacheDuration * 1000;
  }

  get observableData() {
    let cacheDateDiff = 0;
    if (this.cacheDate) {
      cacheDateDiff = new Date().valueOf() - this.cacheDate.valueOf();
    }

    if (
      (!this.cacheData && !this.cacheDate) ||
      this.cacheDuration < cacheDateDiff
    ) {
      this.cacheDate = new Date();
      this.cacheData = this.getAll().pipe(shareReplay(this.cacheSize));
    }

    return this.cacheData;
  }

  getAll(): Observable<ITransaction[]> {
    return this.http.get<ITransaction[]>(this.apiUrl).pipe(
      tap((transactions: ITransaction[]) => transactions),
      catchError(this.handleError)
    );
  }

  groupByExpenseType(
    expenseAreas: string[],
    dateRange: { start: Date; end: Date }
  ): Observable<IBarChart[]> {
    return this.observableData.pipe(
      mergeMap((transactions: ITransaction[]) =>
        from(transactions).pipe(
          filter(
            (transaction) =>
              (expenseAreas.length == 0 ||
                expenseAreas.includes(transaction.expenseArea)) &&
              this.getDateRange(dateRange, transaction)
          ),
          groupBy(
            (g) => g.expenseType,
            (g) => g.amount
          ),
          mergeMap((m) =>
            m.pipe(
              reduce(
                //@ts-ignore
                (acc, cur) => {
                  if (m.key === acc[0] && acc.length > 1) {
                    acc[1] += cur;
                    return [...acc];
                  }
                  return [...acc, cur];
                },
                [m.key]
              )
            )
          ),
          map((arr) => {
            const amount = +Number(Math.abs(+arr[1])).toFixed(2);
            return {
              key: arr[0],
              value: amount,
            } as IBarChart;
          }),
          toArray()
        )
      ),
      catchError(this.handleError)
    ) as Observable<IBarChart[]>;
  }

  getDailyTotalTransaction(
    expenseAreas: string[],
    dateRange: { start: Date; end: Date }
  ): Observable<ILineChart[]> {
    return this.observableData.pipe(
      mergeMap((transactions: ITransaction[]) =>
        from(transactions).pipe(
          filter(
            (transaction) =>
              (expenseAreas.length == 0 ||
                expenseAreas.includes(transaction.expenseArea)) &&
              this.getDateRange(dateRange, transaction)
          ),
          groupBy(
            (g) => g.date,
            (g) => g.transactionNumber
          ),
          mergeMap((m) => m.pipe(reduce((acc, cur) => [...acc, cur], [m.key]))),
          map(
            (arr) =>
              new LineChart(
                this.parseDate(
                  moment(arr[0], 'YYYY-MM-DD').format('DD-MM-YYYY')
                ),
                arr.length - 1
              )
          ),
          toArray()
        )
      ),
      catchError(this.handleError)
    );
  }

  getDailyTotalAmount(
    expenseAreas: string[],
    dateRange: { start: Date; end: Date }
  ): Observable<ILineChart[]> {
    return this.observableData.pipe(
      mergeMap((transactions: ITransaction[]) =>
        from(transactions).pipe(
          filter(
            (transaction) =>
              (expenseAreas.length == 0 ||
                expenseAreas.includes(transaction.expenseArea)) &&
              this.getDateRange(dateRange, transaction)
          ),
          groupBy(
            (g) => g.date,
            (g) => g.amount
          ),
          mergeMap((m) =>
            m.pipe(
              reduce((acc, cur) => [...acc, cur], [m.key] as (number | Date)[])
            )
          ),
          map((arr) => {
            const date: Date = this.parseDate(
              moment(arr[0], 'YYYY-MM-DD').format('DD-MM-YYYY')
            )!;

            arr.shift();
            const amounts = arr as number[];

            let amount: number = amounts.reduce<number>(
              (total: number, amount: number) => total + amount,
              0
            ) as number;
            amount = +Number(Math.abs(amount)).toFixed(2);

            return {
              date: date,
              value: amount,
            } as ILineChart;
          }),
          toArray()
        )
      ),
      catchError(this.handleError)
    ) as Observable<ILineChart[]>;
  }

  getExpenseArea(): Observable<string[]> {
    return this.observableData.pipe(
      mergeMap((transactions: ITransaction[]) => {
        return transactions.reduce(
          (arr, value) => [...arr, value.expenseArea],
          [] as string[]
        );
      }),
      distinct(),
      toArray(),
      catchError(this.handleError)
    );
  }

  private handleError(err: HttpErrorResponse): Observable<never> {
    // in a real world app, we may send the server to some remote logging infrastructure
    // instead of just logging it to the console
    let errorMessage = '';
    if (err.error instanceof ErrorEvent) {
      // A client-side or network error occurred. Handle it accordingly.
      errorMessage = `An error occurred: ${err.error.message}`;
    } else {
      // The backend returned an unsuccessful response code.
      // The response body may contain clues as to what went wrong,
      errorMessage = `Server returned code: ${err.status}, error message is: ${err.message}`;
    }
    console.error(errorMessage);
    return throwError(errorMessage);
  }

  private getDateRange(
    dateRange: { start: Date; end: Date },
    transaction: ITransaction
  ) {
    const transactionDate: Date = this.parseDate(
      moment(transaction.date, 'YYYY-MM-DD').format('DD-MM-YYYY')
    );

    if (dateRange && dateRange.start && dateRange.end) {
      return (
        transactionDate.getTime() >= dateRange.start.getTime() &&
        transactionDate.getTime() <= dateRange.end.getTime()
      );
    }

    return true; // no user input and leave as default
  }
}
