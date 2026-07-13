import Counter from '../models/Counter';

export async function generateAccountNumber(): Promise<string> {
    const counter = await Counter.findOneAndUpdate(
        { _id: 'accountNumber' },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
    );
    return (1000000 + counter.seq).toString();
}
