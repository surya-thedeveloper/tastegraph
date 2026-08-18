const express = require('express');
const { getFlavorGraph, findBridge } = require('../db/queries');

const router = express.Router();

// GET /api/graph/:id — vis-network nodes + edges for ingredient's compound network
router.get('/:id', async (req, res, next) => {
  try {
    const graphData = await getFlavorGraph(req.params.id);
    res.json(graphData);
  } catch (err) {
    next(err);
  }
});

// GET /api/graph/bridge?from=dark-chocolate&to=lavender
router.get('/bridge/path', async (req, res, next) => {
  try {
    const { from, to } = req.query;
    if (!from || !to) {
      return res.status(400).json({ error: 'Bad request', message: 'Both "from" and "to" query params are required' });
    }
    const result = await findBridge(from, to);
    if (!result) {
      return res.status(404).json({ error: 'No path', message: `No flavor connection found between "${from}" and "${to}"` });
    }
    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
