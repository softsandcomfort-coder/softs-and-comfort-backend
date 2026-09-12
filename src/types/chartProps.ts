export type DonutSegment = {
    title?: string;
    color?: string;
    value?: number;
    pct?: number;
    valueText?: string;
    deltaText?: string;
};

export type PromotionalVisitors = {
    value?: string;
    percent?: string;
    trending?: string;
};

export type PromotionalChartPayload = {
    title?: string;
    defaultPeriod?: string;
    periods?: string[];
    visitors?: PromotionalVisitors;
    segments?: DonutSegment[];
    filterData?: Record<
        string,
        { visitors?: PromotionalVisitors; segments?: DonutSegment[] }
    >;
};

export type RevenueStat = {
    label?: string;
    value?: string;
    color?: string;
    deltaText?: string;
    dotClass?: string;
    trending?: string;
    percent?: string;
};

export type RevenueSeries = { name: string; data: number[] };

export type RevenuePeriodBlock = {
    categories?: string[];
    series?: RevenueSeries[];
    stats?: RevenueStat[];
};

export type RevenueChartPayload = {
    title?: string;
    defaultPeriod?: string;
    periods?: string[];
    series?: RevenueSeries[];
    categories?: string[];
    colors?: string[];
    stats?: RevenueStat[];
    filterData?: Record<string, RevenuePeriodBlock>;
};
