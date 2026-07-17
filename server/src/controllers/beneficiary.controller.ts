import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import Beneficiary from '../models/Beneficiary';

export async function getBeneficiaries(req: AuthRequest, res: Response) {
    try {
        const beneficiaries = await Beneficiary.find({ userId: req.user._id }).sort({ createdAt: -1 });
        res.json({ beneficiaries });
    } catch {
        res.status(500).json({ error: 'Error al obtener beneficiarios' });
    }
}

export async function createBeneficiary(req: AuthRequest, res: Response) {
    try {
        const { name, accountNumber, alias, bank } = req.body;

        const beneficiary = new Beneficiary({
            userId: req.user._id,
            name,
            accountNumber,
            alias: alias || '',
            bank: bank || 'VectorBank'
        });

        await beneficiary.save();
        res.status(201).json({ message: 'Beneficiario creado', beneficiary });
    } catch (error: any) {
        if (error.code === 11000) {
            return res.status(400).json({ error: 'Ya tienes un beneficiario con ese numero de cuenta' });
        }
        res.status(500).json({ error: 'Error al crear beneficiario' });
    }
}

export async function updateBeneficiary(req: AuthRequest, res: Response) {
    try {
        const { name, alias, bank } = req.body;
        const beneficiary = await Beneficiary.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id },
            { name, alias, bank },
            { new: true }
        );
        if (!beneficiary) return res.status(404).json({ error: 'Beneficiario no encontrado' });
        res.json({ message: 'Actualizado', beneficiary });
    } catch {
        res.status(500).json({ error: 'Error al actualizar' });
    }
}

export async function deleteBeneficiary(req: AuthRequest, res: Response) {
    try {
        const beneficiary = await Beneficiary.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
        if (!beneficiary) return res.status(404).json({ error: 'No encontrado' });
        res.json({ message: 'Eliminado' });
    } catch {
        res.status(500).json({ error: 'Error al eliminar' });
    }
}
