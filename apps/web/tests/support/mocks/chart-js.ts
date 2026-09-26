import type { ChartConfiguration } from 'chart.js';

export const createdCharts: FakeChart[] = [];

export class FakeChart {
  static readonly register = jest.fn();

  readonly destroy = jest.fn();

  constructor(
    readonly canvas: HTMLCanvasElement,
    readonly config: ChartConfiguration<'line'>,
  ) {
    createdCharts.push(this);
  }
}

export const Chart = FakeChart;
export const CategoryScale = {};
export const Colors = {};
export const Legend = {};
export const LinearScale = {};
export const LineController = {};
export const LineElement = {};
export const PointElement = {};
export const Tooltip = {};
