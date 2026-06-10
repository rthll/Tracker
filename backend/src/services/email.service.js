import nodemailer from "nodemailer";
import { env } from "../config/env.js";

const EMAIL_SUBJECT = "Codigo de cadastro - Tracker de Macronutrientes";
const ACCOUNT_EXISTS_SUBJECT = "Tentativa de cadastro - Tracker de Macronutrientes";

function buildEmailText(code) {
  return [
    `Seu codigo de cadastro e: ${code}`,
    ``,
    `Ele expira em ${env.authCodeTtlMinutes} minutos.`,
    ``,
    `Se voce nao solicitou este codigo, ignore este e-mail.`
  ].join("\n");
}

function buildAccountExistsText() {
  return [
    `Recebemos uma tentativa de cadastro com este e-mail, mas ele ja possui uma conta no Tracker de Macronutrientes.`,
    ``,
    `Se foi voce, basta entrar normalmente. Caso tenha esquecido a senha, use a opcao "Esqueci minha senha" na tela de login.`,
    ``,
    `Se nao foi voce, ignore este e-mail. Nenhuma acao e necessaria.`
  ].join("\n");
}

function buildEmailHtml(code) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;background:#f5f5f5;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;padding:40px;max-width:480px;width:100%;">
          <tr>
            <td style="padding-bottom:6px;">
              <p style="margin:0;font-size:11px;color:#999;text-transform:uppercase;letter-spacing:1.5px;">Tracker de Macronutrientes</p>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom:20px;border-bottom:1px solid #eee;">
              <h1 style="margin:0;font-size:22px;font-weight:700;color:#111;">Seu codigo de cadastro</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 0 8px;">
              <p style="margin:0;font-size:15px;color:#555;line-height:1.6;">Use o codigo abaixo para concluir seu cadastro. Ele expira em <strong style="color:#111;">${env.authCodeTtlMinutes} minutos</strong>.</p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:24px 0;">
              <div style="background:#f8f9fa;border-radius:10px;padding:22px 40px;display:inline-block;border:1px solid #e9ecef;">
                <span style="font-size:42px;font-weight:800;letter-spacing:14px;color:#111;font-family:'Courier New',Courier,monospace;">${code}</span>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding-top:20px;border-top:1px solid #eee;">
              <p style="margin:0;font-size:12px;color:#aaa;line-height:1.6;">Se voce nao solicitou este codigo, ignore este e-mail. Nenhuma acao e necessaria.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

async function sendViaResend(email, { subject, text, html }) {
  const from = env.mailFrom || "Tracker <onboarding@resend.dev>";

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.resendApiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject,
      text,
      ...(html ? { html } : {})
    })
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const error = new Error(`Resend: ${body.message || body.name || response.statusText}`);
    error.statusCode = 502;
    throw error;
  }

  return { delivered: true };
}

let smtpTransporter = null;

function getSmtpTransporter() {
  if (smtpTransporter) {
    return smtpTransporter;
  }

  smtpTransporter = nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpSecure,
    auth: env.smtpUser ? { user: env.smtpUser, pass: env.smtpPass } : undefined
  });

  return smtpTransporter;
}

async function sendViaSmtp(email, { subject, text, html }) {
  await getSmtpTransporter().sendMail({
    from: env.mailFrom,
    to: email,
    subject,
    text,
    ...(html ? { html } : {})
  });

  return { delivered: true };
}

async function sendEmail(email, message, onNotConfigured) {
  if (env.hasResendCredentials) {
    return sendViaResend(email, message);
  }

  if (env.hasSmtpCredentials) {
    return sendViaSmtp(email, message);
  }

  if (env.isDevelopment) {
    return onNotConfigured();
  }

  const error = new Error(
    "Envio de e-mail nao configurado. Configure RESEND_API_KEY ou as variaveis SMTP no servidor."
  );
  error.statusCode = 503;
  throw error;
}

export async function sendSignupCodeEmail(email, code) {
  return sendEmail(email, {
    subject: EMAIL_SUBJECT,
    text: buildEmailText(code),
    html: buildEmailHtml(code)
  }, () => {
    console.info(`[DEV] Codigo de cadastro para ${email}: ${code}`);
    return { delivered: false, devCode: code };
  });
}

export async function sendAccountExistsEmail(email) {
  return sendEmail(email, {
    subject: ACCOUNT_EXISTS_SUBJECT,
    text: buildAccountExistsText()
  }, () => {
    console.info(`[DEV] Tentativa de cadastro com e-mail ja registrado: ${email}`);
    return { delivered: false };
  });
}
