import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';

interface CurrencyRate {
  code: string;
  name: string;
  rate: number;
  change: number;
  changePercent: number;
}

const BASE_RATES: Record<string, number> = {
  GTQ: 1,
  USD: 7.85,
  EUR: 8.52,
  GBP: 9.92,
  MXN: 0.46,
  CNY: 1.08,
  JPY: 0.052,
  CAD: 5.78,
  CHF: 8.92,
  AUD: 5.12,
};

const CURRENCY_NAMES: Record<string, string> = {
  GTQ: 'Quetzal guatemalteco',
  USD: 'Dólar estadounidense',
  EUR: 'Euro',
  GBP: 'Libra esterlina',
  MXN: 'Peso mexicano',
  CNY: 'Yuan chino',
  JPY: 'Yen japonés',
  CAD: 'Dólar canadiense',
  CHF: 'Franco suizo',
  AUD: 'Dólar australiano',
};

function simulateVariation(base: number): { rate: number; change: number; changePercent: number } {
  const variation = (Math.random() - 0.48) * 0.02;
  const rate = parseFloat((base * (1 + variation)).toFixed(4));
  const change = parseFloat((rate - base).toFixed(4));
  const changePercent = parseFloat(((change / base) * 100).toFixed(2));
  return { rate, change, changePercent };
}

export async function getRates(req: AuthRequest, res: Response) {
  try {
    const base = (req.query.base as string)?.toUpperCase() || 'GTQ';

    if (!BASE_RATES[base]) {
      return res.status(400).json({ error: `Moneda base '${base}' no soportada. Usa: GTQ, USD, EUR, GBP, MXN` });
    }

    const rates: CurrencyRate[] = Object.entries(BASE_RATES)
      .filter(([code]) => code !== base)
      .map(([code, baseRate]) => {
        const convertedRate = base === 'GTQ' ? baseRate : baseRate / BASE_RATES[base];
        const { rate, change, changePercent } = simulateVariation(convertedRate);
        return { code, name: CURRENCY_NAMES[code], rate, change, changePercent };
      });

    res.json({
      base,
      timestamp: new Date().toISOString(),
      rates,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener tasas de cambio' });
  }
}

export async function convert(req: AuthRequest, res: Response) {
  try {
    const { from, to, amount } = req.body;

    if (!from || !to || !amount) {
      return res.status(400).json({ error: 'Moneda origen, destino y monto son requeridos' });
    }

    const fromUpper = from.toUpperCase();
    const toUpper = to.toUpperCase();

    if (!BASE_RATES[fromUpper] || !BASE_RATES[toUpper]) {
      return res.status(400).json({ error: 'Moneda no soportada' });
    }

    const fromRate = BASE_RATES[fromUpper];
    const toRate = BASE_RATES[toUpper];
    const result = parseFloat(((amount / fromRate) * toRate).toFixed(2));
    const rate = parseFloat((toRate / fromRate).toFixed(4));

    res.json({
      from: fromUpper,
      to: toUpper,
      amount,
      result,
      rate,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al convertir moneda' });
  }
}
