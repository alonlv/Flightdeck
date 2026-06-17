import express from 'express';
import { jira } from '../jiraClient.js';

export const router = express.Router();

router.get('/whoami', async (req, res, next) => {
  try {
    const me = await jira.myself();
    res.json({ displayName: me.displayName, key: me.key || me.accountId || me.name });
  } catch (err) {
    next(err);
  }
});
