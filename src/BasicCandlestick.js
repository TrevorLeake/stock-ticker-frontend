import * as React from "react";
import { Chart, ChartCanvas } from "@react-financial-charts/core";
import { XAxis, YAxis } from "@react-financial-charts/axes";
import { discontinuousTimeScaleProviderBuilder } from "@react-financial-charts/scales";
import { CandlestickSeries, LineSeries } from "@react-financial-charts/series";
// import { IOHLCData, withOHLCData } from "../../data";
import { withDeviceRatio, withSize } from "@react-financial-charts/utils";
import { CurrentCoordinate, EdgeIndicator, MouseCoordinateX } from "react-financial-charts";


export default class BasicCandlestick extends React.Component {
    margin = { left: 0, right: 40, top: 0, bottom: 24 };
    xScaleProvider = discontinuousTimeScaleProviderBuilder().inputDateAccessor(
        (d) => d.date,
    );

    render() {
        const { data: initialData, height, ratio, width } = this.props;

        const { data, xScale, xAccessor, displayXAccessor } = this.xScaleProvider(initialData);

        const max = xAccessor(data[data.length - 1]);
        const min = xAccessor(data[Math.max(0, data.length - 100)]);
        const xExtents = [min, max];

        return (
            <ChartCanvas
                height={height}
                ratio={ratio}
                width={width}
                margin={this.margin}
                data={data}
                displayXAccessor={displayXAccessor}
                seriesName="Data"
                type="hybrid"
                xScale={xScale}
                xAccessor={xAccessor}
                xExtents={xExtents}
            >
                <Chart id={1} yExtents={this.yExtents}>
                    <CandlestickSeries/>
                    <LineSeries  yAccessor={d => d.close}/>
                    <XAxis />
                    <YAxis showGridLines={true}/>
                </Chart>
            </ChartCanvas>
        );
    }

    yExtents = (data) => {
        return [data.high, data.low];
    };
}

// export const Daily = withOHLCData()(withSize({ style: { minHeight: 600 } })(withDeviceRatio()(BasicCandlestick)));

// export const Intraday = withOHLCData("MINUTES")(
//     withSize({ style: { minHeight: 600 } })(withDeviceRatio()(BasicCandlestick)),
// );