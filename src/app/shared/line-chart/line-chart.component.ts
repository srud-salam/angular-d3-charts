import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  OnChanges,
  ViewChild,
} from '@angular/core';
import * as d3 from 'd3';
import { ILineChart } from '../_interface';

@Component({
  selector: 'app-line-chart',
  templateUrl: './line-chart.component.html',
  styleUrls: ['./line-chart.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LineChartComponent implements OnChanges {
  @ViewChild('chart', { static: true }) protected chartContainer: ElementRef;
  chartProps: any;

  @Input()
  lineChartTitle: string;

  @Input()
  lineChartData: ILineChart[];

  constructor(chartContainer: ElementRef) {
    this.chartContainer = chartContainer;
    this.chartProps = {};
  }

  ngOnChanges(): void {
    if (this.lineChartData) {
      this.createChart();
    }
  }

  createChart() {
    const svg = d3.select(this.chartContainer.nativeElement);
    svg.selectAll('*').remove();
    this.chartProps.svg = svg;

    const margin = {
      top: +this.getAttribute<number>('margin-top'),
      right: +this.getAttribute<number>('margin-right'),
      bottom: +this.getAttribute<number>('margin-bottom'),
      left: +this.getAttribute<number>('margin-left') + 40,
    };

    const width = +this.getAttribute<number>('width');
    const height = +this.getAttribute<number>('height');
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const grp = svg
      .append('g')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    const xScale = d3
      .scaleTime()
      .domain(d3.extent(this.lineChartData, (d) => d.date))
      .range([0, innerWidth])
      .nice();

    const yScale = d3
      .scaleLinear()
      .domain([
        d3.min(this.lineChartData, (d) => d.value),
        d3.max(this.lineChartData, (d) => d.value),
      ])
      .range([innerHeight, 0]);

    const lineChart = d3
      .line<ILineChart>()
      .x((d) => xScale(d.date))
      .y((d) => yScale(d.value))
      .curve(d3.curveMonotoneX);

    grp
      .append('g')
      .attr('class', 'x axis axis--x')
      .attr('transform', 'translate(' + 0 + ',' + innerHeight + ')')
      .call(d3.axisBottom(xScale));

    grp
      .append('g')
      .attr('class', 'y axis axis--y')
      .call(d3.axisLeft(yScale).ticks(5));

    grp
      .append('path')
      .datum(this.lineChartData)
      .style('fill', 'none')
      .attr('class', 'line')
      .attr('d', lineChart);

    grp
      .selectAll('.dot')
      .data(this.lineChartData)
      .enter()
      .append('circle')
      .attr('class', 'dot')
      .attr('cx', (d) => xScale(d.date))
      .attr('cy', (d) => yScale(d.value))
      .attr('r', 4);

    grp
      .append('rect')
      .attr('class', 'line-chart-title')
      .attr('x', innerWidth - 140)
      .attr('y', (d, i) => {
        return i * 20 - 9;
      })
      .attr('width', 10)
      .attr('height', 10);

    grp
      .append('text')
      .attr('class', 'line-chart-title-text')
      .attr('x', innerWidth - 120)
      .attr('y', (d, i) => i * 20)
      .text(this.lineChartTitle);

    if (this.lineChartData.length > 0) {
      grp
        .append('text')
        .attr('class', 'line-chart-title-text')
        .attr('x', innerWidth - 120)
        .attr('y', 20)
        .text(this.lineChartData[0].date.getFullYear());
    }
  }

  onResize() {
    this.createChart();
  }

  private getAttribute<T>(name: string): T {
    return this.chartProps.svg.style(name).replace('px', '');
  }
}
