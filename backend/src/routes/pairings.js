const express = require('express');
const { getPairings, getRecipesByPairing, getSurprisePairing } = require('../db/queries');

const router = express.Router();

// GET /api/pairings/:id — find all ingredients that pair with this one (2-hop graph traversal)
router.get('/:id', async (req, res, next) => {
  try {
    const pairings = await getPairings(req.params.id);
    res.json(pairings);
  } catch (err) {
    next(err);
  }
});

// GET /api/pairings/:id1/with/:id2/recipes — recipes that use both ingredients
router.get('/:id1/with/:id2/recipes', async (req, res, next) => {
  try {
    const recipes = await getRecipesByPairing(req.params.id1, req.params.id2);
    res.json(recipes);
  } catch (err) {
    next(err);
  }
});

// GET /api/pairings/surprise — random cross-category pairing with solid compound overlap
router.get('/surprise/pick', async (req, res, next) => {
  try {
    const pairing = await getSurprisePairing();
    if (!pairing) {
      return res.status(404).json({ error: 'Not found', message: 'Could not find a surprise pairing' });
    }
    res.json(pairing);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
