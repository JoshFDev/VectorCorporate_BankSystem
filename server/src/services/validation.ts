import axios from 'axios';
// axios: libreria para hacer peticiones HTTP a APIs externas

interface ValidationResult {
    valid: boolean;
    message: string;
}

// Validar que el email realmente exista
export async function validateEmail(email: string): Promise<ValidationResult> {
    try {
        const res = await axios.get(
            `https://emailvalidation.abstractapi.com/v1/`,
            {
                params: {
                    api_key: process.env.ABSTRACT_API_KEY,
                    email
                }
            }
        );

        const score = res.data.quality_score;
        // quality_score: 0 a 1. 0.7 o mas es confiable

        const isDeliverable = res.data.deliverability === 'DELIVERABLE';
        // La API indica si el email realmente puede recibir correos

        if (score >= 0.7 && isDeliverable) {
            return { valid: true, message: 'Email valido' };
        }

        return {
            valid: false,
            message: `Email invalido o de baja calidad (score: ${score})`
        };
    } catch (error) {
        return {
            valid: false,
            message: 'No se pudo verificar el email, intenta de nuevo'
        };
    }
}

// Validar codigo postal y obtener ciudad
export async function validateZipCode(zipCode: string, country: string): Promise<ValidationResult> {
    try {
        const res = await axios.get(`https://api.zippopotam.us/${country}/${zipCode}`);
        return {
            valid: true,
            message: `${res.data.places[0]['place name']}, ${res.data.places[0]['state']}`
        };
    } catch {
        return { valid: false, message: 'Codigo postal no valido para ese pais' };
    }
}

// Obtener lista de paises para el registro
export async function getCountries(): Promise<string[]> {
    try {
        const res = await axios.get('https://restcountries.com/v3.1/all');
        return res.data.map((c: any) => c.name.common).sort();
        // Devuelve los nombres de todos los paises ordenados
    } catch {
        return ['Guatemala', 'Mexico', 'Estados Unidos', 'El Salvador'];
        // Fallback si la API no responde
    }
}