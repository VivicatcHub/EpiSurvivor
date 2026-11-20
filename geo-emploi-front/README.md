# geo-emploi-front

Front Next.js 16 (App Router, React 19, Tailwind 4, shadcn/ui, Leaflet) de GéoEmploi : carte publique des offres et espaces chercheur, employeur et administration.

> [!NOTE]
> Le navigateur ne parle jamais à l'API : les Server Components et Server Actions l'appellent côté serveur via `API_URL`. Voir [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md).

## Lancer

Nécessite l'API sur `http://localhost:1234` (voir le [README racine](../README.md)) et Node.js 20.9+.

```bash
npm install
cp .env.example .env.local   # API_URL
npm run dev                  # http://localhost:3000
```

## Scripts

| Commande | Rôle |
| --- | --- |
| `npm run dev` | Serveur de développement |
| `npm run build` | Build de production |
| `npm run start` | Sert le build |
| `npm run lint` | ESLint |

## Repères

| Chemin | Contenu |
| --- | --- |
| `app/` | Pages, Server Actions (`app/actions/`), BFF de la carte (`app/api/offres/`) |
| `components/` | UI par domaine (`map/`, `listings/`, `employer/`, `admin/`…) et `ui/` (shadcn) |
| `lib/` | Client API, session, DAL, schémas et libellés |
| `proxy.ts` | Garde de routes optimiste sur le cookie de session |
