import { ILineChart } from '../_interface';

export class LineChart implements ILineChart {
  date: Date;
  value: number;

  constructor(date: Date, value: number) {
    this.date = date;
    this.value = value;
  }
}
