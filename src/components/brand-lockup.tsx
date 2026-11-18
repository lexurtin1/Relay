"use client";

import Image from "next/image";
import Link from "next/link";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

function RelayMark(props: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden
      className={props.className}
    >
      <circle cx="10" cy="20" r="7.5" fill="var(--relay-brand)" />
      <circle cx="30" cy="20" r="7.5" fill="var(--relay-brand)" />
      <path
        d="M14.5 16.2 L25.5 23.8"
        stroke="var(--relay-brand-hover)"
        strokeWidth="4.2"
        strokeLinecap="round"
      />
      <path
        d="M14.5 23.8 L25.5 16.2"
        stroke="var(--relay-accent-muted)"
        strokeWidth="2.2"
        strokeLinecap="round"
        opacity="0.95"
      />
    </svg>
  );
}

export function RelayLogo(props: {
  appName: string;
  className?: string;
  markClassName?: string;
  wordClassName?: string;
  href?: string;
}) {
  const content = (
    <span
      className={cn(
        "inline-flex items-center gap-2.5 text-[var(--relay-ink)] no-underline",
        props.className,
      )}
    >
      <RelayMark className={cn("h-8 w-8 shrink-0", props.markClassName)} />
      <span
        className={cn(
          "text-[22px] font-semibold leading-none tracking-[-0.035em]",
          props.wordClassName,
        )}
      >
        {props.appName}
      </span>
    </span>
  );

  if (props.href === undefined || props.href === "") {
    return content;
  }

  return (
    <Link href={props.href} className="inline-flex no-underline" aria-label={props.appName}>
      {content}
    </Link>
  );
}

export function CalastoneLogo(props: { className?: string; priority?: boolean }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const src = isDark ? "/brand/logo-on-dark.png" : "/brand/logo-header.png";

  return (
    <Image
      src={src}
      alt="SS&C Calastone"
      width={968}
      height={264}
      priority={props.priority}
      quality={100}
      sizes="(max-width: 640px) 180px, (max-width: 1024px) 260px, 320px"
      className={cn(
        "h-9 w-auto max-w-[min(340px,50vw)] object-contain object-left sm:h-11 md:h-[52px]",
        props.className,
      )}
    />
  );
}

export function BrandLockup(props: { appName: string }) {
  return (
    <div className="flex min-w-0 items-center gap-3 sm:gap-4">
      <CalastoneLogo priority />
      <span
        className="h-7 w-px shrink-0 bg-[var(--relay-border-strong)] sm:h-8"
        aria-hidden
      />
      <RelayLogo
        appName={props.appName}
        href="/"
        markClassName="h-8 w-8 sm:h-9 sm:w-9"
        wordClassName="text-[20px] sm:text-[24px]"
      />
    </div>
  );
}
