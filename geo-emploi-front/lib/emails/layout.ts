export const EMAIL_COLORS = {
  bleu: "#1B3A6B",
  encre: "#11172E",
  texte: "#11172E",
  secondaire: "#56607A",
  bord: "#DDE1EA",
  fond: "#F4F5F8",
  blanc: "#FFFFFF",
  tricoloreBleu: "#1D3A90",
  tricoloreBlanc: "#F1EEEA",
  tricoloreRouge: "#A4252B",
} as const;

const TITRE = "Marianne, Arial, Helvetica, sans-serif";
const CORPS = "Spectral, Georgia, 'Times New Roman', serif";

export type EmailAction = { label: string; url: string };

export function renderEmail({
  preheader,
  title,
  body,
  action,
}: {
  preheader: string;
  title: string;
  body: string[];
  action?: EmailAction;
}): string {
  const c = EMAIL_COLORS;

  const paragraphs = body
    .map(
      (text) =>
        `<p style="margin:0 0 16px;font-family:${CORPS};font-size:16px;line-height:1.6;color:${c.texte};">${text}</p>`,
    )
    .join("");

  const button = action
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
         <tr><td style="background:${c.encre};border-radius:6px;">
           <a href="${action.url}" style="display:inline-block;padding:12px 20px;font-family:${TITRE};font-size:15px;font-weight:600;color:${c.blanc};text-decoration:none;">${action.label}</a>
         </td></tr>
       </table>`
    : "";

  return `<!doctype html>
<html lang="fr">
  <head><meta charset="utf-8" /><meta name="viewport" content="width=device-width" /><title>${title}</title></head>
  <body style="margin:0;padding:0;background:${c.fond};">
    <span style="display:none;font-size:0;line-height:0;max-height:0;overflow:hidden;">${preheader}</span>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${c.fond};padding:24px 12px;">
      <tr><td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:${c.blanc};border:1px solid ${c.bord};border-radius:8px;">
          <!-- Filet tricolore + bloc-marque, en haut à gauche, sur fond plein -->
          <tr><td style="height:4px;padding:0;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
              <td style="background:${c.tricoloreBleu};height:4px;"></td>
              <td style="background:${c.tricoloreBlanc};height:4px;"></td>
              <td style="background:${c.tricoloreRouge};height:4px;"></td>
            </tr></table>
          </td></tr>
          <tr><td style="padding:24px 28px 8px;">
            <table role="presentation" cellpadding="0" cellspacing="0"><tr>
              <td style="width:40px;background:${c.encre};color:${c.blanc};font-family:${TITRE};font-size:18px;font-weight:700;text-align:center;padding:10px 0;border-radius:2px;">JEB</td>
              <td style="padding-left:12px;font-family:${TITRE};line-height:1.25;">
                <span style="display:block;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:${c.secondaire};">Ministère du Job et Bonheur</span>
                <span style="display:block;font-size:18px;font-weight:600;color:${c.bleu};">GéoEmploi</span>
              </td>
            </tr></table>
          </td></tr>
          <tr><td style="padding:16px 28px 28px;">
            <h1 style="margin:0 0 16px;font-family:${TITRE};font-size:22px;font-weight:600;color:${c.bleu};">${title}</h1>
            ${paragraphs}
            ${button}
          </td></tr>
          <tr><td style="padding:16px 28px 24px;border-top:1px solid ${c.bord};font-family:${CORPS};font-size:13px;line-height:1.5;color:${c.secondaire};">
            GéoEmploi — service public du Ministère du Job et Bonheur.<br />
            Vous recevez cet e-mail car vous disposez d'un compte GéoEmploi.
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}
