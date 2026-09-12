"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { asApexOptions, type ApexChartHandle } from "@/lib/apexOptions";

type RevenueChart3Item = {
    revenueLabel: string;
    revenueValue: string;
    revenueTrend: string;
    orderLabel: string;
    orderValue: string;
    orderTrend: string;
    categories: string[];
    revenueSeries: number[];
    orderSeries: number[];
};

type RevenueChart3Data = {
    Weekly: RevenueChart3Item;
    Monthly: RevenueChart3Item;
    Yearly: RevenueChart3Item;
};

type RevenueChart3Props = {
    defaultFilter?: keyof RevenueChart3Data;
    revenueData: RevenueChart3Data;
};

export default function RevenueChart3({
    defaultFilter = "Yearly",
    revenueData,
}: RevenueChart3Props) {
    const chartRef = useRef<ApexChartHandle | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);

    const [mounted, setMounted] = useState(false);
    const [filter, setFilter] =
        useState<keyof RevenueChart3Data>(defaultFilter);

    const filters = useMemo(
        () => Object.keys(revenueData) as Array<keyof RevenueChart3Data>,
        [revenueData],
    );

    const currentData = revenueData[filter] ?? revenueData.Yearly;

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted || !containerRef.current) return;

        let disposed = false;

        const renderChart = async () => {
            const ApexCharts = (await import("apexcharts")).default;
            if (!containerRef.current || disposed) return;

            if (chartRef.current) {
                chartRef.current.destroy();
                chartRef.current = null;
            }

            containerRef.current.innerHTML = "";

            const options = {
                series: [
                    {
                        name: "Revenue",
                        type: "area",
                        data: currentData.revenueSeries,
                    },
                    {
                        name: "Store",
                        type: "line",
                        data: currentData.orderSeries,
                    },
                ],
                chart: {
                    height: 362,
                    type: "area",
                    stacked: false,
                    toolbar: { show: false },
                    animations: {
                        enabled: true,
                        easing: "easeinout",
                        speed: 10,
                        animateGradually: {
                            enabled: true,
                            delay: 10,
                        },
                        dynamicAnimation: {
                            enabled: true,
                            speed: 10,
                        },
                    },
                },
                dataLabels: { enabled: false },
                legend: { show: false },
                stroke: {
                    width: [3, 3],
                    curve: "smooth",
                    colors: ["#FF7433", "#8D79F6"],
                },
                colors: ["#FF7433", "#8D79F6"],
                fill: {
                    colors: ["#FF7433"],
                    opacity: 0.39,
                },
                yaxis: { show: false },
                xaxis: {
                    labels: {
                        style: {
                            colors: "#95989D",
                        },
                    },
                    tooltip: { enabled: false },
                    categories: currentData.categories,
                },
                tooltip: {
                    shared: true,
                    intersect: false,
                },
            };

            const chart = new ApexCharts(
                containerRef.current,
                asApexOptions(options),
            );

            chartRef.current = chart;
            await chart.render();
        };

        renderChart();

        return () => {
            disposed = true;
            if (chartRef.current) {
                chartRef.current.destroy();
                chartRef.current = null;
            }
        };
    }, [mounted, currentData]);

    if (!mounted) return null;

    return (
        <div className="wg-box">
            <div className="flex items-center justify-between">
                <h5>Revenue</h5>

                <div className="dropdown default style-box">
                    <button
                        className="btn btn-secondary dropdown-toggle"
                        type="button"
                        data-bs-toggle="dropdown"
                        aria-haspopup="true"
                        aria-expanded="false"
                    >
                        <span className="view-all">
                            {filter}
                            <i className="icon-chevron-down"></i>
                        </span>
                    </button>

                    <ul className="dropdown-menu dropdown-menu-end">
                        {filters
                            .filter((item) => item !== filter)
                            .map((item) => (
                                <li key={item}>
                                    <button
                                        type="button"
                                        onClick={() => setFilter(item)}
                                    >
                                        {item}
                                    </button>
                                </li>
                            ))}
                    </ul>
                </div>
            </div>

            <div className="flex flex-wrap gap40">
                <div>
                    <div className="mb-1">
                        <div className="block-legend">
                            <div className="dot t3"></div>
                            <div className="text-tiny">
                                {currentData.revenueLabel}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap12">
                        <h4>{currentData.revenueValue}</h4>
                        <div className="box-icon-trending up">
                            <i className="icon-trending-up"></i>
                            <div className="body-title number">
                                {currentData.revenueTrend}
                            </div>
                        </div>
                    </div>
                </div>

                <div>
                    <div className="mb-1">
                        <div className="block-legend">
                            <div className="dot t5"></div>
                            <div className="text-tiny">
                                {currentData.orderLabel}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap12">
                        <h4>{currentData.orderValue}</h4>
                        <div className="box-icon-trending up">
                            <i className="icon-trending-up"></i>
                            <div className="body-title number">
                                {currentData.orderTrend}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div id="line-chart-21" ref={containerRef}></div>
        </div>
    );
}