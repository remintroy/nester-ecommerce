import express from 'express';
import * as users from '../app/users.js';

const app = express.Router();

app.get('/', users.home);

export default app;