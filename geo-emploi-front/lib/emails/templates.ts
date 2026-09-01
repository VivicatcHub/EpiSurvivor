import { renderEmail } from "./layout";

export function bienvenueEmail({
  prenom,
  url,
}: {
  prenom: string;
  url: string;
}) {
  return renderEmail({
    preheader: "Votre compte GéoEmploi est actif.",
    title: `Bienvenue sur GéoEmploi, ${prenom}`,
    body: [
      "Votre compte est actif. La carte des offres est déjà consultable, et vous pouvez désormais postuler en un geste depuis n'importe quelle annonce.",
      "Renseignez vos compétences et votre disponibilité pour que les employeurs de votre secteur vous repèrent.",
    ],
    action: { label: "Ouvrir la carte des offres", url },
  });
}

export function candidatureRecueEmail({
  entreprise,
  candidat,
  offre,
  url,
}: {
  entreprise: string;
  candidat: string;
  offre: string;
  url: string;
}) {
  return renderEmail({
    preheader: `Nouvelle candidature pour « ${offre} ».`,
    title: "Vous avez reçu une candidature",
    body: [
      `Bonjour ${entreprise}, ${candidat} vient de postuler à votre offre « ${offre} ».`,
      "Vous pouvez consulter le profil et répondre depuis votre espace employeur.",
    ],
    action: { label: "Voir la candidature", url },
  });
}

export function offreArchiveeEmail({
  entreprise,
  offre,
  url,
}: {
  entreprise: string;
  offre: string;
  url: string;
}) {
  return renderEmail({
    preheader: `« ${offre} » a été archivée après 30 jours.`,
    title: "Votre offre a été archivée",
    body: [
      `Bonjour ${entreprise}, votre offre « ${offre} » a atteint 30 jours de publication : elle a été retirée automatiquement de la carte.`,
      "Vous pouvez la republier en un clic si le poste est toujours ouvert.",
    ],
    action: { label: "Republier l'offre", url },
  });
}
