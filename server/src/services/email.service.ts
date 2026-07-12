import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

export async function sendPasswordResetEmail(to: string, token: string): Promise<void> {
    const resetUrl = `http://localhost:4200/reset-password?token=${token}`;

    await transporter.sendMail({
        from: `"VectorBank" <${process.env.EMAIL_USER}>`,
        to,
        subject: 'Recuperacion de contrasena - VectorBank',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
                <h2 style="color: #1e40af;">VectorBank</h2>
                <p>Has solicitado restablecer tu contrasena.</p>
                <p>Haz clic en el siguiente enlace para crear una nueva contrasena:</p>
                <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background: #1e40af; color: #fff; text-decoration: none; border-radius: 8px; margin: 16px 0;">
                    Restablecer contrasena
                </a>
                <p style="color: #64748b; font-size: 13px;">Este enlace expira en 1 hora.</p>
                <p style="color: #64748b; font-size: 13px;">Si no solicitaste esto, ignora este correo.</p>
            </div>
        `,
    });
}
