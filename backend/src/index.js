require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { verifyConnection, closeDriver } = require('./db/driver');
const errorHandler = require('./middleware/errorHandler');

const ingredientsRouter = require('./routes/ingredients');
const pairingsRouter = require('./routes/pairings');
const recipesRouter = require('./routes/recipes');
const graphRouter = require('./routes/graph');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    /\.vercel\.app$/,  // allow any vercel deployment
  ],
  methods: ['GET'],
}));

app.use(express.json());

// health check — useful for Render and debugging
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/ingredients', ingredientsRouter);
app.use('/api/pairings', pairingsRouter);
app.use('/api/recipes', recipesRouter);
app.use('/api/graph', graphRouter);

// 404 fallback
app.use((req, res) => {
  res.status(404).json({ error: 'Not found', message: `Route ${req.method} ${req.path} does not exist` });
});

app.use(errorHandler);

async function start() {
  try {
    await verifyConnection();
    app.listen(PORT, () => {
      console.log(`TasteGraph API running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start:', err.message);
    process.exit(1);
  }
}

// graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down...');
  await closeDriver();
  process.exit(0);
});

start();
