import mongoose, { Schema, Types } from 'mongoose';

export interface ICounter {
    _id: string;
    seq: number;
}

const counterSchema = new Schema({
    _id: { type: String, required: true },
    seq: { type: Number, default: 0 }
}, { _id: false });

export default mongoose.model<ICounter>('Counter', counterSchema);
