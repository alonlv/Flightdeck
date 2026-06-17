import express from 'express';
import { JiraError } from '../jiraClient.js';
import * as ticketService from '../ticketService.js';

export const router = express.Router();

router.get('/tickets', async (req, res, next) => {
  try {
    const { tickets, meta } = await ticketService.listTickets();
    res.json({ tickets, meta, total: tickets.length });
  } catch (err) {
    next(err);
  }
});

router.get('/tickets/:id', async (req, res, next) => {
  try {
    res.json(await ticketService.getTicket(req.params.id));
  } catch (err) {
    next(err);
  }
});

router.post('/tickets', async (req, res, next) => {
  try {
    res.status(201).json(await ticketService.createTicket(req.body || {}));
  } catch (err) {
    next(err);
  }
});

router.patch('/tickets/:id', async (req, res, next) => {
  try {
    const { ticket, warnings } = await ticketService.updateTicket(req.params.id, req.body || {});
    res.json({ ticket, warnings });
  } catch (err) {
    if (err.status === 409) return res.status(409).json({ error: err.message });
    next(err);
  }
});

router.delete('/tickets/:id', async (req, res, next) => {
  try {
    await ticketService.deleteTicket(req.params.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

router.use((err, req, res, next) => {
  if (err instanceof JiraError) {
    return res.status(err.status).json({ error: err.message });
  }
  console.error(err);
  res.status(500).json({ error: err.message || 'Unexpected server error' });
});
