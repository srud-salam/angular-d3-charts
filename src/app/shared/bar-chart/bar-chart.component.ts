import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  OnChanges,
  ViewChild,
} from '@angular/core';
import * as d3 from 'd3';
import { IBarChart } from '../_interface';

@Component({
  selector: 'app-bar-chart',
  templateUrl: './bar-chart.component.html',
  styleUrls: ['./bar-chart.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BarChartComponent implements OnChanges {
  @ViewChild('chart', { static: true })
  protected chartContainer: ElementRef;
  chartProps: any;

  @Input()
  barChartTitle: string;

  @Input()
  barChartData: IBarChart[];

  constructor(chartContainer: ElementRef) {
    this.chartContainer = chartContainer;
    this.chartProps = {};
  }

  ngOnChanges(): void {
    if (this.barChartData) {
      this.initChart();
    }
  }

  initChart() {
    const svg = d3.select(this.chartContainer.nativeElement);
    svg.selectAll('*').remove();
    this.chartProps.svg = svg;

    const margin = {
      top: +this.getAttribute<number>('margin-top'),
      right: +this.getAttribute<number>('margin-right'),
      bottom: +this.getAttribute<number>('margin-bottom') + 130,
      left: +this.getAttribute<number>('margin-left') + 40,
    };

    const width = +this.getAttribute<number>('width');
    const height = +this.getAttribute<number>('height');
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const xScale = d3.scaleBand().rangeRound([0, innerWidth]).padding(0.2);
    const yScale = d3.scaleLinear().rangeRound([innerHeight, 0]);

    xScale.domain(this.barChartData.map((d) => d.key));
    yScale.domain([0, d3.max(this.barChartData, (d) => d.value)]);

    const grp = svg
      .append('g')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    grp
      .append('g')
      .attr('class', 'x axis')
      .attr('transform', 'translate(' + 0 + ',' + innerHeight + ')')
      .call(d3.axisBottom(xScale))
      .selectAll('text')
      .style('text-anchor', 'end')
      .attr('dx', '-.8em')
      .attr('dy', '.15em')
      .attr('transform', 'rotate(-65)');

    grp
      .append('g')
      .attr('class', 'y axis')
      .call(d3.axisLeft(yScale).ticks(5))
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 6)
      .attr('dy', '0.71em')
      .attr('text-anchor', 'end')
      .text('Expense Type');

    grp
      .selectAll('.bar')
      .data(this.barChartData)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', (d) => xScale(d.key))
      .attr('y', (d) => yScale(d.value))
      .attr('width', xScale.bandwidth())
      .attr('height', (d) => innerHeight - yScale(d.value));

    grp
      .append('rect')
      .attr('class', 'bar-chart-title')
      .attr('x', innerWidth - 140)
      .attr('y', (d, i) => {
        return i * 20 - 9;
      })
      .attr('width', 10)
      .attr('height', 10);

    grp
      .append('text')
      .attr('class', 'bar-chart-title-text')
      .attr('x', innerWidth - 120)
      .attr('y', (d, i) => i * 20)
      .text(this.barChartTitle);
  }

  onResize() {
    this.initChart();
  }

  private getAttribute<T>(name: string): T {
    return this.chartProps.svg.style(name).replace('px', '');
  }
}
