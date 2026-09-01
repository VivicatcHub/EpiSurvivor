import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center p-8">
      <Link
        href="/offres"
        className="rounded-xl border border-current/25 px-8 py-4 text-lg font-medium transition-colors hover:bg-current/10"
      >
        Voir les offres
      </Link>
    </main>
  );
}
