import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { destinataire, sujet, message } = await request.json();

  if (!destinataire || !sujet || !message) {
    return NextResponse.json({ erreur: "Champs manquants" }, { status: 400 });
  }

  const reponse = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: destinataire }] }],
      from: { email: process.env.SENDGRID_FROM_EMAIL, name: "Voom Impulse" },
      subject: sujet,
      content: [{ type: "text/plain", value: message }],
    }),
  });

  if (!reponse.ok) {
    const detail = await reponse.text();
    return NextResponse.json({ erreur: detail }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
