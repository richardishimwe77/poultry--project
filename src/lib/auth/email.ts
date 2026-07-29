import nodemailer from "nodemailer"

function getTransporter() {
  const host = process.env.SMTP_HOST
  const port = Number(process.env.SMTP_PORT) || 587
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (!host || !user || !pass) {
    console.warn("SMTP not configured — emails will be logged to console")
    return null
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  })
}

export async function sendVerificationEmail(email: string, token: string) {
  const transporter = getTransporter()
  const url = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/verify?token=${token}`

  if (!transporter) {
    console.log(`[EMAIL] Verification link for ${email}: ${url}`)
    return
  }

  await transporter.sendMail({
    from: `"Poultry Farm" <${process.env.SMTP_USER}>`,
    to: email,
    subject: "Verify your Poultry Farm account",
    html: `<p>Click <a href="${url}">here</a> to verify your email.</p><p>Token: ${token}</p>`,
  })
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const transporter = getTransporter()
  const url = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/reset-password?token=${token}`

  if (!transporter) {
    console.log(`[EMAIL] Password reset link for ${email}: ${url}`)
    return
  }

  await transporter.sendMail({
    from: `"Poultry Farm" <${process.env.SMTP_USER}>`,
    to: email,
    subject: "Reset your Poultry Farm password",
    html: `<p>Click <a href="${url}">here</a> to reset your password.</p>`,
  })
}
