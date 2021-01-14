import { IBarChart } from '../_interface';

export class BarChart implements IBarChart {
  key: string;
  value: number;

  constructor(key: string, value: number) {
    this.key = key;
    this.value = value;
  }
}
