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

interface TransactionEmailData {
    to: string;
    userName: string;
    type: 'deposit' | 'withdrawal' | 'transfer_in' | 'transfer_out';
    amount: number;
    accountNumber: string;
    relatedAccount?: string;
    description?: string;
    balanceAfter: number;
}

const TYPE_LABELS: Record<string, string> = {
    deposit: 'Deposito',
    withdrawal: 'Retiro',
    transfer_in: 'Transferencia recibida',
    transfer_out: 'Transferencia enviada',
};

const TYPE_COLORS: Record<string, string> = {
    deposit: '#16a34a',
    withdrawal: '#dc2626',
    transfer_in: '#1e40af',
    transfer_out: '#ea580c',
};

export async function sendTransactionEmail(data: TransactionEmailData): Promise<void> {
    const label = TYPE_LABELS[data.type];
    const color = TYPE_COLORS[data.type];
    const sign = data.type === 'deposit' || data.type === 'transfer_in' ? '+' : '-';

    let detail = `Cuenta: ${data.accountNumber}`;
    if (data.relatedAccount) {
        detail += data.type.includes('in')
            ? `\nDe cuenta: ${data.relatedAccount}`
            : `\nA cuenta: ${data.relatedAccount}`;
    }

    await transporter.sendMail({
        from: `"VectorBank" <${process.env.EMAIL_USER}>`,
        to: data.to,
        subject: `${label} - VectorBank`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
                <h2 style="color: #1e40af;">VectorBank</h2>
                <p>Hola <strong>${data.userName}</strong>,</p>
                <p>Se ha registrado una ${label.toLowerCase()} en tu cuenta:</p>
                <div style="background: #f8fafc; border-left: 4px solid ${color}; padding: 16px; border-radius: 0 8px 8px 0; margin: 16px 0;">
                    <p style="margin: 0; font-size: 13px; color: #64748b;">${label}</p>
                    <p style="margin: 4px 0 0; font-size: 24px; font-weight: 700; color: ${color};">${sign} Q${data.amount.toFixed(2)}</p>
                    <p style="margin: 8px 0 0; font-size: 13px; color: #64748b;">${detail}</p>
                    ${data.description ? `<p style="margin: 4px 0 0; font-size: 13px; color: #64748b;">Descripcion: ${data.description}</p>` : ''}
                    <p style="margin: 8px 0 0; font-size: 13px; color: #64748b;">Saldo actual: Q${data.balanceAfter.toFixed(2)}</p>
                </div>
                <p style="color: #64748b; font-size: 13px;">Si no reconoces esta transaccion, contacta soporte inmediatamente.</p>
            </div>
        `,
    });
}
