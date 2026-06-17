import express from 'express';
import cors from 'cors';
import { config, assertConfigured } from './config.js';
import { router as ticketsRouter } from './routes/tickets.js';
import { router as whoamiRouter } from './routes/whoami.js';

assertConfigured();

const app = express();
app.use(cors({ origin: config.clientOrigin }));
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true, authMode: config.authMode }));
app.use('/api', ticketsRouter);
app.use('/api', whoamiRouter);

app.listen(config.port, () => {
  console.log(`Flightdeck server listening on http://localhost:${config.port} (auth mode: ${config.authMode})`);
});
