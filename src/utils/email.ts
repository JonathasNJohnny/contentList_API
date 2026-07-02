import nodemailer from "nodemailer";

import { env } from "../config/env";
import { AppError } from "../shared/errors/AppError";

type SendVerificationEmailInput = {
  to: string;
  name: string;
  code: string;
};

function createTransporter() {
  if (!env.smtpHost || !env.smtpUser || !env.smtpPass) {
    throw new AppError("Configure SMTP_HOST, SMTP_USER and SMTP_PASS.", 503);
  }

  return nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpPort === 465,
    auth: {
      user: env.smtpUser,
      pass: env.smtpPass,
    },
  });
}

export async function sendVerificationEmail({
  to,
  name,
  code,
}: SendVerificationEmailInput) {
  const transporter = createTransporter();

  await transporter.sendMail({
    from: env.smtpUser,
    to,
    subject: "Codigo de verificacao ContentList",
    text: `Ola, ${name}. Seu codigo de verificacao e: ${code}`,
  });
}
