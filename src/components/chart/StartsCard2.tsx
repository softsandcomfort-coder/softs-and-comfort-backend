"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { asApexOptions, type ApexChartHandle } from "@/lib/apexOptions";

type StartsCard2Card = {
    title: string;
    icon?: React.ReactNode;
    shapeBg?: React.ReactNode;
    chartColor?: string;
    color?: string;
    chartHeight?: number;
    defaultPeriod: string;
    chartData: Record<string, { value: string | number; series: number[] }>;
};

type StartsCard2Props = {
    card: StartsCard2Card;
};

export default function StartsCard2({ card }: StartsCard2Props) {
    const chartRef = useRef<ApexChartHandle | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [mounted, setMounted] = useState(false);
    const [filter, setFilter] = useState<string>(card.defaultPeriod);
    const [showDropdown, setShowDropdown] = useState(false);

    const filters = useMemo(() => Object.keys(card.chartData), [card]);
    const currentData = card.chartData[filter] ?? { value: "—", series: [] as number[] };

    const series = currentData.series;
    const first = series?.[0] ?? 0;
    const last = series?.[series.length - 1] ?? 0;
    const isUp = last >= first;

    const percent =
        first === 0
            ? "0%"
            : `${Math.abs(((last - first) / first) * 100).toFixed(2)}%`;

    // A brand-new store has nothing to plot. Showing an empty axis and a "0%"
    // trend arrow reads as broken, so both are left out until there is data.
    const hasData = (series ?? []).some((n) => n > 0);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Render chart when filter changes
    useEffect(() => {
        if (!mounted || !hasData || !containerRef.current) return;
        let disposed = false;

        const renderChart = async () => {
            const ApexCharts = (await import("apexcharts")).default;
            if (!containerRef.current || disposed) return;

            chartRef.current?.destroy();
            chartRef.current = null;
            containerRef.current.innerHTML = "";

            const chart = new ApexCharts(
                containerRef.current,
                asApexOptions({
                    series: [
                        {
                            name: card.title,
                            data: currentData.series,
                        },
                    ],
                    chart: {
                        type: "bar",
                        height: card.chartHeight,
                        toolbar: { show: false },
                    },
                    plotOptions: {
                        bar: {
                            horizontal: false,
                            columnWidth: "3px",
                            borderRadiusApplication: "end",
                        },
                    },
                    dataLabels: { enabled: false },
                    legend: { show: false },
                    colors: [card.chartColor],
                    stroke: { show: false },
                    grid: { show: false },
                    xaxis: {
                        labels: { show: false },
                        axisTicks: { show: false },
                        axisBorder: { show: false },
                    },
                    yaxis: { show: false },
                    tooltip: {
                        y: {
                            formatter: (val: number) => `${val}`,
                        },
                    },
                }),
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
    }, [mounted, hasData, currentData, card.chartColor, card.title, card.chartHeight]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as Element | null;
            if (!target?.closest(".dropdown.default")) setShowDropdown(false);
        };
        document.addEventListener("click", handleClickOutside);
        return () => document.removeEventListener("click", handleClickOutside);
    }, []);

    if (!mounted) return null;

    return (
        <div className="wg-chart-default">
            <div className="top">
                <div className="flex items-center gap14">
                    {/* Icon hexagon */}
                    <div className="image type-white">
                        {card.shapeBg}
                        <span className="icon">{card.icon}</span>
                    </div>
                    <div>
                        <div className="flex gap10 items-center">
                            <div className="body-text mt-2 mb-4">
                                {card.title}
                            </div>
                            {hasData && (
                            <div
                                className={`box-icon-trending ${isUp ? "up" : "down"}`}
                            >
                                <i
                                    className={`icon-trending-${isUp ? "up" : "down"}`}
                                    style={{ color: card.color }}
                                    aria-label={`Trending ${isUp ? "upwards" : "downwards"}`}
                                    role="img"
                                ></i>
                                <div className="body-title number">
                                    {percent}
                                </div>
                            </div>
                            )}
                        </div>
                        <h4>
                            <strong>{currentData.value}</strong>
                        </h4>
                    </div>
                </div>

                {/* Dropdown filter */}
                <nav className="dropdown default" aria-label="Select period for chart">
                    <button
                        className="btn btn-secondary dropdown-toggle"
                        type="button"
                        data-bs-toggle="dropdown"
                        aria-haspopup="true"
                        aria-expanded={showDropdown}
                        onClick={() => setShowDropdown((prev) => !prev)}
                    >
                        <span className="view-all">
                            {filter}
                            <i className="icon-chevron-down"></i>
                        </span>
                    </button>

                    <ul
                        className={`dropdown-menu dropdown-menu-end${
                            showDropdown ? " show" : ""
                        }`}
                        role="menu"
                    >
                        {filters.map((item) => (
                            <li key={item} role="none">
                                <a
                                    href="#"
                                    className={item === filter ? "active" : ""}
                                    role="menuitem"
                                    aria-current={item === filter ? "page" : undefined}
                                    tabIndex={0}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setFilter(item);
                                        setShowDropdown(false);
                                    }}
                                >
                                    {item}
                                </a>
                            </li>
                        ))}
                    </ul>
                </nav>
            </div>

            {hasData && (
                <div className="wrap-chart">
                    <div
                        className="wrap-line-chart"
                        style={{ minHeight: `${(card.chartHeight ?? 0) + 30}px` }}
                        ref={containerRef}
                    />
                </div>
            )}
        </div>
    );
}
