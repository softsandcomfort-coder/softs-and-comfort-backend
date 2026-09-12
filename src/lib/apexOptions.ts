import type { ApexOptions } from "apexcharts";

export type ApexChartHandle = {
    destroy: () => void;
    render: () => Promise<unknown>;
};

export function asApexOptions(options: object): ApexOptions {
    return options as ApexOptions;
}
