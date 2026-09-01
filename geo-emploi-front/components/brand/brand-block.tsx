import { cn } from "@/lib/utils";

const MARK_SIZES = {
  sm: "size-7",
  md: "size-10",
  lg: "size-14",
} as const;

const TEXT_SIZES = {
  sm: "text-[0.95rem]",
  md: "text-lg",
  lg: "text-2xl",
} as const;

export type BrandSize = keyof typeof MARK_SIZES;

export function BrandMark({
  className,
  size = "sm",
}: {
  className?: string;
  size?: BrandSize;
}) {
  return (
    <svg
      viewBox="0 0 100 100"
      role="img"
      aria-label="Ministère du Job et Bonheur"
      className={cn(MARK_SIZES[size], "shrink-0 rounded-[2px]", className)}
    >
      <rect width="100" height="82" fill="#11172E" />
      <text
        x="50"
        y="46"
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#FFFFFF"
        fontFamily="var(--font-heading)"
        fontWeight="700"
        fontSize="38"
        letterSpacing="1"
      >
        JEB
      </text>
      <rect y="82" width="33.34" height="18" fill="#1D3A90" />
      <rect x="33.33" y="82" width="33.34" height="18" fill="#F1EEEA" />
      <rect x="66.66" y="82" width="33.34" height="18" fill="#A4252B" />
    </svg>
  );
}

export function BrandBlock({
  size = "sm",
  showMinistry = true,
  className,
  plate = true,
}: {
  size?: BrandSize;
  showMinistry?: boolean;
  className?: string;
  plate?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2.5 p-[0.25em]",
        plate && "bg-background",
        size === "sm" ? "text-sm" : size === "md" ? "text-base" : "text-lg",
        className,
      )}
    >
      <BrandMark size={size} />
      <span className="flex flex-col leading-tight">
        {showMinistry ? (
          <span className="font-sans text-[0.62em] tracking-[0.08em] text-muted-foreground uppercase">
            Ministère du Job et Bonheur
          </span>
        ) : null}
        <span
          className={cn(
            "font-heading font-semibold text-primary",
            TEXT_SIZES[size],
          )}
        >
          GéoEmploi
        </span>
      </span>
    </span>
  );
}
