"use client";

import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function TooltipProvider(props: { children: ReactNode }) {
  return (
    <TooltipPrimitive.Provider delayDuration={200}>
      {props.children}
    </TooltipPrimitive.Provider>
  );
}

export function Tooltip(props: {
  content: ReactNode;
  children: ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  className?: string;
}) {
  return (
    <TooltipPrimitive.Root>
      <TooltipPrimitive.Trigger asChild>{props.children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side={props.side ?? "top"}
          sideOffset={6}
          className={cn(
            "z-50 max-w-xs rounded-xl border border-[var(--relay-border)] bg-[var(--relay-ink)] px-2 py-1.5 text-xs text-white shadow-sm",
            props.className,
          )}
        >
          {props.content}
          <TooltipPrimitive.Arrow className="fill-[var(--relay-ink)]" />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}
