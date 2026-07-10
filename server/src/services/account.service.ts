import Account from '../models/Account';

export async function generateAccountNumber(): Promise<string> {
    // Busca la ultima cuenta creada para saber el siguiente numero
    const lastAccount = await Account.findOne()
        .sort({ createdAt: -1 })
        .select('accountNumber');

    if (!lastAccount) {
        return '1000001'; // Primera cuenta del sistema
    }

    // Incrementa el numero
    const nextNumber = parseInt(lastAccount.accountNumber) + 1;
    return nextNumber.toString();
}
