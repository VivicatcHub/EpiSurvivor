import { Award, Lock } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Badge as BadgeType } from "@/lib/schemas";

export function BadgeGrid({
  badges,
  caught,
}: {
  badges: BadgeType[];
  caught: number;
}) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {badges.map((badge) => {
        const unlocked = caught >= badge.goal;
        return (
          <li key={badge.id}>
            <Card
              size="sm"
              className={cn("h-full", unlocked ? "" : "opacity-60")}
            >
              <CardHeader>
                {unlocked ? (
                  <Award className="size-5 text-primary" aria-hidden />
                ) : (
                  <Lock className="size-5 text-muted-foreground" aria-hidden />
                )}
                <CardTitle>{badge.label}</CardTitle>
                <CardDescription>{badge.description}</CardDescription>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                {unlocked
                  ? "Débloqué"
                  : `${caught} / ${badge.goal} offres attrapées`}
              </CardContent>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
