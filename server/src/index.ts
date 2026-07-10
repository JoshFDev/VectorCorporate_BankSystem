import app from './app';
// Importa la aplicacion Express desde app.ts

import { connectDB } from './database';
// Importa la funcion connectDB desde database.ts

import dotenv from 'dotenv';
dotenv.config();

const PORT = process.env.PORT || 3000;
// Toma el puerto de variable de entorno PORT, si no existe usa 3000

// Primero conecta a MongoDB, luego inicia el servidor
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server on port ${PORT}`);
    });
});

