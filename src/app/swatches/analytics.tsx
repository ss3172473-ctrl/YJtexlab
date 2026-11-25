"use client";

import { useEffect } from "react";

type AnalyticsWindow = Window & { dataLayer?: unknown[] };

function tag(...commands: unknown[]): void;
function tag() {
  const analytics = window as AnalyticsWindow;
  analytics.dataLayer ??= [];
  // gtag's command queue consumes arguments objects.
  // eslint-disable-next-line prefer-rest-params
  analytics.dataLayer.push(arguments);
}

export function campaignParams() {
  const query = new URLSearchParams(window.location.search);
  function value(key: string) {
    const raw = query.get(key) ?? "";
    return /^[a-zA-Z0-9_.-]{1,80}$/.test(raw) ? raw : undefined;
  }
  return {
    campaign_source: value("utm_source"),
    campaign_medium: value("utm_medium"),
    campaign_name: value("utm_campaign"),
  };
}

const ORIGIN = "https://yjtexlab.com";
const PAGE_LOCATION = `${ORIGIN}/swatches`;
let measurementId = "";
let loadingId = "";

export function trackConfirmedLead(rollCount: number) {
  if (!measurementId || !Number.isInteger(rollCount) || rollCount < 1 || rollCount > 100) return;
  if (loadingId !== measurementId) {
    loadingId = measurementId;
    tag("js", new Date());
    tag("config", measurementId, {
      send_page_view: false,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      page_referrer: "",
      ignore_referrer: true,
      page_location: PAGE_LOCATION,
    });
    const script = document.createElement("script");
    script.async = true;
    script.referrerPolicy = "no-referrer";
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    script.onerror = () => { loadingId = ""; script.remove(); };
    document.head.append(script);
  }
  tag("event", "generate_lead", {
    send_to: measurementId,
    source: "swatches",
    page_location: PAGE_LOCATION,
    page_referrer: "",
    ignore_referrer: true,
    roll_count: rollCount,
  });
}

export default function SwatchesAnalytics({ id }: { id: string }) {
  useEffect(() => {
    if (!/^G-[A-Z0-9]+$/.test(id) || window.location.origin !== ORIGIN) return;
    measurementId = id;
    document.documentElement.dataset.swatchesLeadAnalytics = "ready";
    return () => {
      measurementId = "";
      delete document.documentElement.dataset.swatchesLeadAnalytics;
    };
  }, [id]);
  return null;
}
