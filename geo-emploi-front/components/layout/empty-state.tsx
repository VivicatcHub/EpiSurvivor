import { BrandMark } from "@/components/brand/brand-block";
import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-xl border border-border bg-background px-6 py-10 text-center",
        className,
      )}
    >
      <BrandMark size="sm" className="opacity-90" />
      <p className="font-heading text-base font-semibold text-primary">
        {title}
      </p>
      {description ? (
        <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      ) : null}
      {action}
    </div>
  );
}
