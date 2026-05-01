const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const errorHandler = require('./middlewares/errorHandler');

const app = express();
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(morgan('dev'));
app.use(rateLimit({ windowMs: 60 * 1000, max: 120 }));

app.get('/health', (_, res) => res.json({ ok: true }));
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/transactions', require('./routes/transaction.routes'));
app.use('/api/admin', require('./routes/admin.routes'));

app.use(errorHandler);
module.exports = app;
