"use client";

const BLEU = "#1B3A6B";
const ENCRE = "#11172E";
const TITRE = "Marianne, Arial, Helvetica, sans-serif";
const CORPS = 'Spectral, Georgia, "Times New Roman", serif';

export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html lang="fr">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          background: "#FFFFFF",
          color: ENCRE,
          fontFamily: CORPS,
          display: "flex",
          alignItems: "center",
        }}
      >
        <title>Service indisponible — GéoEmploi</title>
        <main style={{ maxWidth: "42rem", margin: "0 auto", padding: "2rem" }}>
          {/* Bloc-marque, sur fond plein, zone de protection incluse. */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              padding: "0.5rem",
              background: "#FFFFFF",
            }}
          >
            <svg viewBox="0 0 100 100" width="40" height="40" aria-hidden>
              <rect width="100" height="82" fill={ENCRE} />
              <text
                x="50"
                y="46"
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#FFFFFF"
                fontFamily={TITRE}
                fontWeight="700"
                fontSize="38"
              >
                JEB
              </text>
              <rect y="82" width="33.34" height="18" fill="#1D3A90" />
              <rect x="33.33" y="82" width="33.34" height="18" fill="#F1EEEA" />
              <rect x="66.66" y="82" width="33.34" height="18" fill="#A4252B" />
            </svg>
            <span style={{ lineHeight: 1.2 }}>
              <span
                style={{
                  display: "block",
                  fontFamily: TITRE,
                  fontSize: "0.65rem",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "#56607A",
                }}
              >
                Ministère du Job et Bonheur
              </span>
              <span
                style={{
                  display: "block",
                  fontFamily: TITRE,
                  fontSize: "1.1rem",
                  fontWeight: 600,
                  color: BLEU,
                }}
              >
                GéoEmploi
              </span>
            </span>
          </div>

          <p
            style={{
              fontFamily: TITRE,
              fontSize: "0.8rem",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#56607A",
              marginTop: "2rem",
            }}
          >
            Erreur 500
          </p>
          <h1
            style={{
              fontFamily: TITRE,
              fontSize: "2rem",
              color: BLEU,
              margin: "0.5rem 0 1rem",
            }}
          >
            Le service est momentanément indisponible.
          </h1>
          <p style={{ fontSize: "1.05rem", color: "#56607A", margin: 0 }}>
            L&apos;incident a été enregistré
            {error.digest ? ` sous la référence ${error.digest}` : ""}. Merci de
            réessayer dans quelques instants.
          </p>

          <button
            type="button"
            onClick={() => retry()}
            style={{
              marginTop: "1.5rem",
              fontFamily: TITRE,
              fontSize: "0.95rem",
              fontWeight: 500,
              /* Le bleu institutionnel n'est jamais un fond de bouton. */
              background: ENCRE,
              color: "#FFFFFF",
              border: "none",
              borderRadius: "0.375rem",
              padding: "0.6rem 1.1rem",
              cursor: "pointer",
            }}
          >
            Réessayer
          </button>

          <div
            aria-hidden
            style={{
              display: "flex",
              height: "4px",
              width: "10rem",
              marginTop: "2rem",
            }}
          >
            <span style={{ flex: 1, background: "#1D3A90" }} />
            <span style={{ flex: 1, background: "#F1EEEA" }} />
            <span style={{ flex: 1, background: "#A4252B" }} />
          </div>
        </main>
      </body>
    </html>
  );
}
