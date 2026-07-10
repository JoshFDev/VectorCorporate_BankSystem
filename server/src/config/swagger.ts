import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'VectorBank API',
            version: '1.0.0',
            description: 'API del sistema bancario VectorBank'
        },
        servers: [
            { url: 'http://localhost:3000', description: 'Local' }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            }
        }
    },
    apis: ['./src/routes/*.ts']
};

export const swaggerSpec = swaggerJsdoc(options);