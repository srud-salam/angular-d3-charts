import { ISankeyDiagram } from '../_interface';

export class SankeyDiagram implements ISankeyDiagram {
  key: string;
  value: number;

  constructor(key: string, value: number) {
    this.key = key;
    this.value = value;
  }
}
