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
      bottom: +this.getAttribute<number>('margin-bottom') + 40,
      left: +this.getAttribute<number>('margin-left') + 200, // need to caculate the larget length of text
    };

    const width = +this.getAttribute<number>('width');
    const height = +this.getAttribute<number>('height');
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    const xScale = d3
      .scaleLinear()
      .domain([0, d3.max(this.barChartData, (d) => d.value)])
      .rangeRound([0, innerWidth]);

    const yScale = d3
      .scaleBand()
      .domain(this.barChartData.map((d) => d.key))
      .rangeRound([innerHeight, 0])
      .padding(0.2);

    const grp = svg
      .append('g')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    grp
      .append('g')
      .attr('class', 'x axis')
      .attr('transform', 'translate(0,' + innerHeight + ')')
      .call(d3.axisBottom(xScale))
      .selectAll('text')
      .attr('transform', 'translate(-10,0)rotate(-45)')
      .style('text-anchor', 'end');

    grp.append('g').attr('class', 'y axis').call(d3.axisLeft(yScale));

    grp
      .selectAll('.bar')
      .data(this.barChartData)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', xScale(0))
      .attr('y', (d) => yScale(d.key))
      .attr('width', (d) => xScale(d.value))
      .attr('height', yScale.bandwidth());

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
