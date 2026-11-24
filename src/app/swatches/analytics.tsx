"use client";

import Script from "next/script";
import { useEffect } from "react";

type EventFields = Record<string, unknown>;
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

function pageReferrer() {
  try {
    const origin = new URL(document.referrer).origin;
    return origin === "null" ? "" : origin;
  } catch { return ""; }
}

export function track(name: string, fields: EventFields = {}) {
  tag("event", name, { ...fields, page_location: `${window.location.origin}/swatches`, page_referrer: pageReferrer() });
}

const configured = new Set<string>();

export default function SwatchesAnalytics({ id }: { id: string }) {
  const enabled = /^G-[A-Z0-9]+$/.test(id);
  useEffect(() => {
    if (!enabled || configured.has(id)) return;
    configured.add(id);
    tag("js", new Date());
    tag("config", id, {
      send_page_view: false,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      page_referrer: pageReferrer(),
      page_location: `${window.location.origin}/swatches`,
      ...campaignParams(),
    });
    track("page_view", { page_title: "Swatches | YJ TexLab" });
  }, [enabled, id]);
  return enabled ? <Script src={`https://www.googletagmanager.com/gtag/js?id=${id}`} strategy="afterInteractive" /> : null;
}
