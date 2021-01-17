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

  private startYear: number;
  private endYear: number;

  constructor(chartContainer: ElementRef) {
    this.chartContainer = chartContainer;
    this.chartProps = {};
  }

  ngOnChanges(): void {
    if (this.lineChartData) {
      if (this.lineChartData.length > 0) {
        this.startYear = this.lineChartData[0].date.getFullYear();
        this.endYear = this.lineChartData[
          this.lineChartData.length - 1
        ].date.getFullYear();
      }

      this.createChart();
    }
  }

  createChart() {
    const svg = d3.select(this.chartContainer.nativeElement);
    svg.selectAll('*').remove();
    this.chartProps.svg = svg;

    // Set the dimensions of the canvas / graph
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

    // Add group to canvas
    const grp = svg
      .append('g')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    // Set the ranges
    const xScale = d3
      .scaleTime()
      .domain(d3.extent(this.lineChartData, (d) => d.date))
      .range([0, innerWidth]);

    const yScale = d3
      .scaleLinear()
      .domain(d3.extent(this.lineChartData, (d) => d.value))
      .range([innerHeight, 0]);

    // Define the axes
    grp
      .append('g')
      .attr('class', 'x axis axis--x')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale));

    grp
      .append('g')
      .attr('class', 'y axis axis--y')
      .call(d3.axisLeft(yScale))
      .append('text')
      .attr('fill', '#000')
      .attr('transform', 'rotate(-90)')
      .attr('y', 6)
      .attr('dy', '0.71em')
      .attr('text-anchor', 'end')
      .text(this.lineChartTitle);

    // Define the line
    const lineChart = d3
      .line<ILineChart>()
      .x((d) => xScale(d.date))
      .y((d) => yScale(d.value))
      .curve(d3.curveMonotoneX);

    // draw the line on svg
    grp
      .append('path')
      .datum(this.lineChartData)
      .style('fill', 'none')
      .attr('class', 'line')
      .attr('d', lineChart);

    //add dot line
    grp
      .selectAll('.dot')
      .data(this.lineChartData)
      .enter()
      .append('circle')
      .attr('class', 'dot')
      .attr('cx', (d) => xScale(d.date))
      .attr('cy', (d) => yScale(d.value))
      .attr('r', 4);

    //add year anotation to x date
    grp
      .append('g')
      .attr('transform', 'translate(' + 0 + ',' + innerHeight + ')')
      .append('text')
      .attr('fill', '#000')
      .attr('y', 6)
      .attr('dy', '0.71em')
      .attr('font-size', '0.71rem')
      .attr('text-anchor', 'end')
      .text(this.startYear);

    // line chart title text
    grp
      .append('text')
      .attr('class', 'line-chart-title-text')
      .attr('x', innerWidth - 120)
      .attr('y', (d, i) => i * 20)
      .text(this.lineChartTitle);

    grp
      .append('text')
      .attr('class', 'line-chart-title-text')
      .attr('x', innerWidth - 120)
      .attr('y', 20)
      .text(
        this.startYear === this.endYear
          ? `${this.startYear} Year`
          : `${this.startYear} - ${this.endYear}`
      );

    // Initialise the tooltip
    const tooltip = grp.append('g').style('display', 'none');

    // append the x line
    tooltip
      .append('line')
      .attr('class', 'tooltip-x-line')
      .attr('y1', innerHeight)
      .attr('y2', 0);

    // append the y line
    tooltip
      .append('line')
      .attr('class', 'tooltip-y-line')
      .attr('x1', innerWidth)
      .attr('x2', 0);

    // define the circle
    tooltip.append('circle').attr('class', 'tooltip-circle').attr('r', 5);

    // tooltip text
    tooltip
      .append('text')
      .attr('class', 'tooltip-text tooltip-y1-text')
      .style('stroke-width', '3.5px')
      .style('opacity', 0.8)
      .attr('dx', 8)
      .attr('dy', '-1.8em');

    tooltip
      .append('text')
      .attr('class', 'tooltip-text tooltip-y2-text')
      .style('stroke-width', '3.5px')
      .style('opacity', 0.8)
      .attr('dx', 8)
      .attr('dy', '-0.5em');

    // append the rectangle to capture mouse
    const bisect = d3.bisector((d: ILineChart) => d.date).left;
    svg
      .append('rect')
      .attr('width', width)
      .attr('height', height)
      .style('fill', 'none')
      .style('pointer-events', 'all')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
      .on('mouseover', () => tooltip.style('display', null))
      .on('mouseout', () => tooltip.style('display', 'none'))
      .on('touchmove mousemove', (event) => {
        const point = d3.pointer(event);
        const xDate = xScale.invert(point[0]);
        const index = bisect(this.lineChartData, xDate, 1);
        const d0 = this.lineChartData[index - 1];
        const d1 = this.lineChartData[index];

        const d =
          d1 &&
          xDate.valueOf() - d0.date.valueOf() >
            d1.date.valueOf() - xDate.valueOf()
            ? d1
            : d0;

        const xPos = xScale(d.date);
        const yPos = yScale(d.value);

        tooltip
          .select('.tooltip-circle')
          .attr('transform', 'translate(' + xPos + ',' + yPos + ')');

        tooltip
          .select('.tooltip-x-line')
          .attr('transform', 'translate(' + xPos + ',' + innerHeight * -1 + ')')
          .attr('y2', innerHeight + innerHeight);

        tooltip
          .select('.tooltip-y-line')
          .attr('transform', 'translate(' + innerWidth * -1 + ',' + yPos + ')')
          .attr('x2', innerWidth + innerWidth);

        tooltip
          .select('.tooltip-y1-text')
          .attr('transform', 'translate(' + xPos + ',' + yPos + ')')
          .attr(
            'dx',
            index + 5 > this.lineChartData.length
              ? -70 - d.date.toLocaleDateString().length
              : 8
          )
          .text(d.date.toLocaleDateString());

        tooltip
          .select('.tooltip-y2-text')
          .attr('transform', 'translate(' + xPos + ',' + yPos + ')')
          .attr(
            'dx',
            index + 5 > this.lineChartData.length
              ? -75 - d.value.toString().length
              : 8
          )
          .text('Value:' + d.value);
      });
  }

  onResize() {
    this.createChart();
  }

  private getAttribute<T>(name: string): T {
    return this.chartProps.svg.style(name).replace('px', '');
  }
}
