const express = require('express');
const { searchIngredients, getIngredient, getRecipesByIngredient } = require('../db/queries');

const router = express.Router();

// GET /api/ingredients?q=chocolate
router.get('/', async (req, res, next) => {
  try {
    const query = req.query.q || '';
    const ingredients = await searchIngredients(query);
    res.json(ingredients);
  } catch (err) {
    next(err);
  }
});

// GET /api/ingredients/:id
router.get('/:id', async (req, res, next) => {
  try {
    const ingredient = await getIngredient(req.params.id);
    if (!ingredient) {
      return res.status(404).json({ error: 'Not found', message: `No ingredient with id "${req.params.id}"` });
    }
    res.json(ingredient);
  } catch (err) {
    next(err);
  }
});

// GET /api/ingredients/:id/recipes
router.get('/:id/recipes', async (req, res, next) => {
  try {
    const recipes = await getRecipesByIngredient(req.params.id);
    res.json(recipes);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
