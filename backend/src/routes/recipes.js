const express = require('express');
const { getAllRecipes } = require('../db/queries');

const router = express.Router();

// GET /api/recipes
router.get('/', async (req, res, next) => {
  try {
    const recipes = await getAllRecipes();
    res.json(recipes);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
