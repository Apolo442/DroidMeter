import 'dotenv/config';
import { buildServer } from './server.js';
import { startRegistry } from './registry.js';

const PORT = Number(process.env.PORT) || 3333;

const app = await buildServer();
await app.listen({ port: PORT, host: '0.0.0.0' });
console.log(`DroidMeter rodando na porta ${PORT}`);

await startRegistry();
