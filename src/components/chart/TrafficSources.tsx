"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { asApexOptions, type ApexChartHandle } from "@/lib/apexOptions";


type TrafficSourceItem = {
  key: string;
  title: string;
  pct: number;
  color: string;
  valueText: string;
  deltaText: string;
};

type TrafficSourceData = {
  title: string;
  defaultPeriod: string;
  periods: string[];
  visitors: { value: string; percent: string; trending: string };
  Weekly: TrafficSourceItem[];
  Monthly: TrafficSourceItem[];
  Yearly: TrafficSourceItem[];
};

const FILTERS = ["Weekly", "Monthly", "Yearly"];

interface TrafficSourcesProps {
  trafficSourceData: TrafficSourceData;
}

export default function TrafficSources({ trafficSourceData }: TrafficSourcesProps) {
  const donutRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<ApexChartHandle | null>(null);

  const [mounted, setMounted] = useState(false);
  const [filter, setFilter] = useState<string>(trafficSourceData.defaultPeriod || "Weekly");
  const [showDropdown, setShowDropdown] = useState(false);

  const segments = useMemo<TrafficSourceItem[]>(() => {
    return (trafficSourceData[filter as keyof TrafficSourceData] as TrafficSourceItem[]) || trafficSourceData.Weekly || [];
  }, [filter, trafficSourceData]);

  const [center, setCenter] = useState<TrafficSourceItem>(segments[0]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setCenter(segments[0]);
  }, [segments]);

  useEffect(() => {
    if (!mounted || !donutRef.current) return;

    let disposed = false;
    let resizeTimer: ReturnType<typeof setTimeout> | undefined;

    const renderDonut = async () => {
      const ApexCharts = (await import("apexcharts")).default;
      if (!donutRef.current || disposed) return;

      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }

      donutRef.current.innerHTML = "";

      const options = {
        series: segments.map((s: TrafficSourceItem) => s.pct),
        labels: segments.map((s: TrafficSourceItem) => s.key),
        colors: segments.map((s: TrafficSourceItem) => s.color),
        chart: {
          type: "donut",
          height: 330,
          toolbar: { show: false },
          animations: {
            enabled: true,
            easing: "easeinout",
            speed: 600,
          },
          events: {
            dataPointMouseEnter: (
              event: unknown,
              chartContext: unknown,
              config: { dataPointIndex: number }
            ) => {
              const item = segments[config.dataPointIndex];
              if (item) {
                setCenter(item);
              }
            },
            mouseLeave: () => {
              setCenter(segments[0]);
            },
          },
        },
        dataLabels: {
          enabled: false,
        },
        legend: {
          show: false,
        },
        stroke: {
          width: 0,
        },
        plotOptions: {
          pie: {
            expandOnClick: false,
            donut: {
              size: "74%",
              labels: {
                show: false,
              },
            },
          },
        },
        tooltip: {
          y: {
            formatter: (val: number | string) => `${val}%`,
          },
        },
        states: {
          hover: {
            filter: {
              type: "darken",
              value: 0.85,
            },
          },
          active: {
            allowMultipleDataPointsSelection: false,
            filter: {
              type: "none",
            },
          },
        },
      };

      const chart = new ApexCharts(donutRef.current, asApexOptions(options));
      chartRef.current = chart;
      await chart.render();
    };

    renderDonut();

    const handleResize = () => {
      if (resizeTimer !== undefined) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        renderDonut();
        setCenter(segments[0]);
      }, 200);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      disposed = true;
      window.removeEventListener("resize", handleResize);
      if (resizeTimer !== undefined) clearTimeout(resizeTimer);

      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [mounted, segments]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target?.closest(".dropdown.default.style-box")) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  if (!mounted) return null;

  return (
    <div className="wg-box w-half">
      <div className="flex items-center justify-between">
        <h5>{trafficSourceData.title}</h5>

        <div className="dropdown default style-box">
          <button
            className="btn btn-secondary dropdown-toggle"
            type="button"
            data-bs-toggle="dropdown"
            aria-haspopup="true"
            aria-expanded={showDropdown}
            onClick={() => setShowDropdown((v) => !v)}
          >
            <span className="view-all">
              {filter}
              <i className="icon-chevron-down"></i>
            </span>
          </button>
          {showDropdown && (
            <ul className="dropdown-menu dropdown-menu-end show">
              {FILTERS.filter((f) => f !== filter).map((f) => (
                <li key={f}>
                  <button
                    type="button"
                    onClick={() => {
                      setFilter(f);
                      setShowDropdown(false);
                    }}
                  >
                    {f}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="block-warning w-full">
        <i className="icon-alert-octagon"></i>
        <div>Traffics channels have been generating the most traffics over past day</div>
      </div>

      <div className="donut-wrap style-1">
        <div className="morris-donut" ref={donutRef}></div>

        <div className="center">
          <div className="center-inner">
            <span
              className="center-badge"
              style={{ borderColor: center?.color }}
            ></span>

            <p className="center-title">{center?.title}</p>

            <div className="center-row">
              <div className="center-value">{center?.valueText}</div>

              <div className="center-delta" style={{ color: center?.color }}>
                <svg
                  width="19"
                  height="12"
                  viewBox="0 0 19 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    fill="currentColor"
                    d="M13.9978 0.824398L15.3944 2.22102L10.6614 6.95404L7.4705 3.76313C7.09224 3.38488 6.48122 3.38488 6.10297 3.76313L0.28369 9.59211C-0.0945633 9.97036 -0.0945633 10.5814 0.28369 10.9596C0.661943 11.3379 1.27297 11.3379 1.65122 10.9596L6.78188 5.81928L9.97279 9.01018C10.351 9.38843 10.9621 9.38843 11.3403 9.01018L16.7619 3.59825L18.1586 4.99488C18.4592 5.29554 18.983 5.08217 18.983 4.65542V0.48494C18.9927 0.213373 18.7793 0 18.5077 0H14.3469C13.9105 0 13.6971 0.523735 13.9978 0.824398Z"
                  />
                </svg>
                <span className="text-main-dark">{center?.deltaText}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="flex gap15 justify-center flex-wrap mb-14">
          <div className="block-legend style-1">
            <div className="dot t4"></div>
            <div className="body-text">Organic Search</div>
          </div>
          <div className="block-legend style-1">
            <div className="dot t2"></div>
            <div className="body-text">Referrals</div>
          </div>
        </div>

        <div className="flex gap15 justify-center flex-wrap">
          <div className="block-legend style-1">
            <div className="dot t1"></div>
            <div className="body-text">Social media</div>
          </div>
          <div className="block-legend style-1">
            <div className="dot t3"></div>
            <div className="body-text">Other</div>
          </div>
        </div>
      </div>
    </div>
  );
}