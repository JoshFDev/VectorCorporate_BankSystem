import { Response } from 'express';
import * as notificationService from '../services/notification.service';
import { AuthRequest } from '../middleware/auth.middleware';

export async function getNotifications(req: AuthRequest, res: Response) {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const result = await notificationService.getNotifications(req.user._id.toString(), page, limit);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener notificaciones' });
    }
}

export async function getUnreadCount(req: AuthRequest, res: Response) {
    try {
        const count = await notificationService.getUnreadCount(req.user._id.toString());
        res.json({ count });
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener conteo de notificaciones' });
    }
}

export async function markAsRead(req: AuthRequest, res: Response) {
    try {
        const success = await notificationService.markAsRead(req.user._id.toString(), req.params.id);
        if (!success) return res.status(404).json({ error: 'Notificacion no encontrada' });
        res.json({ message: 'Notificacion marcada como leida' });
    } catch (error) {
        res.status(500).json({ error: 'Error al marcar notificacion' });
    }
}

export async function markAllAsRead(req: AuthRequest, res: Response) {
    try {
        await notificationService.markAllAsRead(req.user._id.toString());
        res.json({ message: 'Todas las notificaciones marcadas como leidas' });
    } catch (error) {
        res.status(500).json({ error: 'Error al marcar notificaciones' });
    }
}
