"use client";

import { useId } from "react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import "./landing-network.css";

type NetworkVisualProps = {
  className?: string;
};

/** SVG anchors aligned to flex card positions (viewBox 400×440) */
const PROVIDER = { x: 88, y: 96 };
const HUB = { x: 200, y: 220 };
const BUYER = { x: 312, y: 352 };

const PATH_PROVIDER_HUB = `M ${PROVIDER.x} ${PROVIDER.y} C 120 ${PROVIDER.y}, 155 165, ${HUB.x} ${HUB.y}`;
const PATH_HUB_BUYER = `M ${HUB.x} ${HUB.y} C 245 275, 290 320, ${BUYER.x} ${BUYER.y}`;
const PATH_FULL = `${PATH_PROVIDER_HUB} C 245 275, 290 320, ${BUYER.x} ${BUYER.y}`;

/**
 * Abstract recovery-network diagram — provider → Quanta Loop → buyer.
 */
export function NetworkVisual({ className }: NetworkVisualProps) {
  const rawId = useId().replace(/:/g, "");
  const arrowId = `network-arrow-${rawId}`;
  const gridId = `network-grid-${rawId}`;

  return (
    <div className={cn("flex w-full flex-col gap-1.5", className)}>
      <div className="relative aspect-[4/5] w-full min-[420px]:aspect-[5/4] sm:aspect-[6/5] lg:aspect-[10/9]">
        {/* Frame + connections */}
        <div className="absolute inset-0 overflow-hidden rounded-2xl border border-border bg-muted/20 shadow-subtle">
          <svg
            className="absolute inset-0 h-full w-full"
            viewBox="0 0 400 440"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              <pattern
                id={gridId}
                width="18"
                height="18"
                patternUnits="userSpaceOnUse"
              >
                <circle
                  cx="1"
                  cy="1"
                  r="0.6"
                  fill="#0f1416"
                  fillOpacity="0.05"
                />
              </pattern>
              <marker
                id={arrowId}
                markerWidth="7"
                markerHeight="7"
                refX="5.5"
                refY="3.5"
                orient="auto"
              >
                <path d="M0 0 L8 4 L0 8 Z" fill="#2baa6b" fillOpacity="0.9" />
              </marker>
            </defs>
            <rect width="400" height="440" fill={`url(#${gridId})`} />
          </svg>

          <svg
            className="absolute inset-0 z-[1] h-full w-full"
            viewBox="0 0 400 440"
            preserveAspectRatio="xMidYMid meet"
            fill="none"
          >
            {/* Underlay — readable at rest */}
            <path
              d={PATH_FULL}
              stroke="#0f1416"
              strokeWidth="2.5"
              strokeOpacity="0.08"
              strokeLinecap="round"
            />
            <path
              d={PATH_FULL}
              stroke="#c5ced6"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d={PATH_PROVIDER_HUB}
              stroke="#2baa6b"
              strokeWidth="2.25"
              strokeOpacity="0.72"
              strokeLinecap="round"
              markerEnd={`url(#${arrowId})`}
              className="network-line-primary"
            />
            <path
              d={PATH_HUB_BUYER}
              stroke="#2baa6b"
              strokeWidth="2.25"
              strokeOpacity="0.72"
              strokeLinecap="round"
              markerEnd={`url(#${arrowId})`}
              className="network-line-primary"
            />
            <path
              d={PATH_FULL}
              stroke="#2baa6b"
              strokeWidth="1.75"
              strokeOpacity="0.85"
              strokeDasharray="4 8"
              strokeLinecap="round"
              className="network-line-flow"
            />
            <circle
              cx={HUB.x}
              cy={HUB.y}
              r="48"
              fill="#2baa6b"
              fillOpacity="0.06"
              className="network-hub-pulse"
            />
            <circle
              cx={PROVIDER.x}
              cy={PROVIDER.y}
              r="6"
              fill="#2baa6b"
              fillOpacity="0.9"
              className="network-junction"
            />
            <circle
              cx={HUB.x}
              cy={HUB.y}
              r="7"
              fill="#2baa6b"
              className="network-junction network-junction--delay-1"
            />
            <circle
              cx={BUYER.x}
              cy={BUYER.y}
              r="6"
              fill="#2baa6b"
              fillOpacity="0.9"
              className="network-junction network-junction--delay-2"
            />
            <circle r="4" fill="#2baa6b" fillOpacity="0.95">
              <animateMotion
                dur="4.5s"
                repeatCount="indefinite"
                path={PATH_FULL}
              />
            </circle>
            <circle r="2.5" fill="#2baa6b" fillOpacity="0.5">
              <animateMotion
                dur="4.5s"
                repeatCount="indefinite"
                path={PATH_FULL}
                begin="1.5s"
              />
            </circle>
          </svg>
        </div>

        {/* Cards — flex zones with consistent inset padding */}
        <div className="relative z-10 flex h-full flex-col justify-between p-2.5 min-[420px]:p-3 sm:p-3.5 lg:p-4">
          <div className="flex justify-start">
            <Card
              variant="elevated"
              className="w-[min(100%,78%)] max-w-[15rem] border-border/90 p-2.5 shadow-card min-[420px]:w-[min(100%,72%)] min-[420px]:p-3 sm:max-w-[16rem] lg:max-w-[18rem] lg:p-3.5"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-heading text-small font-semibold text-card-foreground">
                  Material Provider
                </p>
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-35 [animation-duration:2.5s] motion-reduce:animate-none" />
                  <span className="relative h-2 w-2 rounded-full bg-accent" />
                </span>
              </div>
              <p className="mt-1.5 text-caption text-muted-foreground">
                Plastic Scrap Available
              </p>
              <Badge variant="outline" className="mt-2.5">
                Available
              </Badge>
            </Card>
          </div>

          <div className="flex items-center justify-center py-0.5">
            <Card
              variant="elevated"
              className="network-card-hub w-[min(100%,84%)] max-w-[14rem] border-2 border-accent/40 bg-card p-2.5 shadow-elevated min-[420px]:w-[min(100%,78%)] min-[420px]:p-3 sm:max-w-[15.5rem] lg:max-w-[17.5rem] lg:p-3.5"
            >
              <div className="mb-2 flex items-center gap-2 border-b border-border/80 pb-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-accent/10">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                </span>
                <p className="text-eyebrow text-accent">MARKETPLACE</p>
              </div>
              <p className="font-heading text-small font-semibold text-card-foreground sm:text-base">
                Quanta Loop
              </p>
              <p className="mt-1 text-caption text-muted-foreground">
              Connect • Communicate • Complete Deals
              </p>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                <Badge variant="accent" className="text-[10px]">
                  Registered
                </Badge>
                <Badge variant="secondary" className="text-[10px]">
                  Aligned
                </Badge>
              </div>
            </Card>
          </div>

          <div className="flex justify-end">
            <Card
              variant="elevated"
              className="w-[min(100%,78%)] max-w-[15rem] border-border/90 p-2.5 shadow-card min-[420px]:w-[min(100%,72%)] min-[420px]:p-3 sm:max-w-[16rem] lg:max-w-[18rem] lg:p-3.5"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-heading text-small font-semibold text-card-foreground">
                  Buyer
                </p>
                <span className="h-2 w-2 shrink-0 rounded-full bg-success" />
              </div>
              <p className="mt-1.5 text-caption text-muted-foreground">
                Looking for Plastic Scrap
              </p>
              <Badge variant="success" className="mt-2.5">
                Matched
              </Badge>
            </Card>
          </div>
        </div>
      </div>

      {/* Legend outside frame — no overlap with buyer card */}
      <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-lg border border-border bg-background px-3 py-1.5 shadow-subtle">
        <span className="network-trust-dot h-2 w-2 shrink-0 rounded-full bg-accent" />
        <span className="text-caption font-medium text-muted-foreground">
          Matching flow
        </span>
        <span className="hidden text-caption text-muted-foreground/80 min-[380px]:inline">
          ·
        </span>
        <span className="text-caption text-muted-foreground">
          Direct Buyer-Seller Connections
        </span>
      </div>
    </div>
  );
}
