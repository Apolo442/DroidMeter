import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../../.env') });
import { buildServer } from './server.js';
import { startRegistry } from './registry.js';

const PORT = Number(process.env.PORT) || 3333;

const app = await buildServer();
await app.listen({ port: PORT, host: '0.0.0.0' });
console.log(`DroidMeter rodando na porta ${PORT}`);

await startRegistry();
