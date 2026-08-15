"use client";

import { useReportWebVitals } from "next/web-vitals";
import { captureWebVital } from "./posthog";

export function WebVitals() {
  useReportWebVitals((metric) => {
    captureWebVital({
      id: metric.id,
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      navigationType: metric.navigationType,
    });
  });

  return null;
}
