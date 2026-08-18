const { getDriver } = require('./driver');

// neo4j returns integers as a special type — this helper converts them to plain JS numbers
// took me a bit to realize why my scores were coming out as objects
function toPlain(record) {
  const obj = record.toObject();
  for (const key in obj) {
    const val = obj[key];
    if (val && typeof val === 'object' && 'low' in val && 'high' in val) {
      obj[key] = val.low;
    }
  }
  return obj;
}

function session() {
  return getDriver().session();
}

// Get all ingredients — optionally filter by name search
async function searchIngredients(query = '') {
  const s = session();
  try {
    const result = await s.run(
      `MATCH (i:Ingredient)
       WHERE toLower(i.name) CONTAINS toLower($query)
       OPTIONAL MATCH (i)-[:IN_CATEGORY]->(c:Category)
       RETURN i, c.name AS category
       ORDER BY i.name
       LIMIT 50`,
      { query }
    );
    return result.records.map(r => ({
      ...r.get('i').properties,
      category: r.get('category'),
    }));
  } finally {
    await s.close();
  }
}

// Get a single ingredient with its flavor compounds
async function getIngredient(id) {
  const s = session();
  try {
    const result = await s.run(
      `MATCH (i:Ingredient {id: $id})
       OPTIONAL MATCH (i)-[r:CONTAINS]->(fc:FlavorCompound)
       OPTIONAL MATCH (i)-[:IN_CATEGORY]->(cat:Category)
       RETURN i,
              collect({
                id: fc.id,
                name: fc.name,
                aroma_descriptor: fc.aroma_descriptor,
                chemical_class: fc.chemical_class,
                amount: r.amount
              }) AS compounds,
              cat.name AS category`,
      { id }
    );
    if (result.records.length === 0) return null;
    const r = result.records[0];
    return {
      ...r.get('i').properties,
      category: r.get('category'),
      compounds: r.get('compounds').filter(c => c.id !== null),
    };
  } finally {
    await s.close();
  }
}

// The main pairing query — 2-hop traversal through shared flavor compounds
// This is the one that would be genuinely awkward to write in SQL
async function getPairings(id) {
  const s = session();
  try {
    const result = await s.run(
      `MATCH (a:Ingredient {id: $id})-[:CONTAINS]->(fc:FlavorCompound)<-[:CONTAINS]-(b:Ingredient)
       WHERE a <> b
       WITH b, collect(fc.name) AS sharedCompounds, count(fc) AS overlap
       ORDER BY overlap DESC
       RETURN b.id AS id,
              b.name AS name,
              b.description AS description,
              b.emoji AS emoji,
              b.category AS category,
              sharedCompounds,
              overlap
       LIMIT 12`,
      { id }
    );
    return result.records.map(r => ({
      id: r.get('id'),
      name: r.get('name'),
      description: r.get('description'),
      emoji: r.get('emoji'),
      category: r.get('category'),
      sharedCompounds: r.get('sharedCompounds'),
      overlap: r.get('overlap').low ?? r.get('overlap'),
    }));
  } finally {
    await s.close();
  }
}

// Find the shortest flavor bridge between two ingredients
// "what's the connection between miso and lavender?"
async function findBridge(fromId, toId) {
  const s = session();
  try {
    const result = await s.run(
      `MATCH (a:Ingredient {id: $fromId}), (b:Ingredient {id: $toId})
       MATCH path = shortestPath((a)-[:PAIRS_WITH*..8]-(b))
       RETURN [n IN nodes(path) | {id: n.id, name: n.name, emoji: n.emoji}] AS bridge,
              length(path) AS hops`,
      { fromId, toId }
    );
    if (result.records.length === 0) return null;
    const r = result.records[0];
    return {
      bridge: r.get('bridge'),
      hops: r.get('hops').low ?? r.get('hops'),
    };
  } finally {
    await s.close();
  }
}

// Get graph data for vis-network visualization
// Returns nodes (ingredient + its compounds) and edges (CONTAINS relationships)
async function getFlavorGraph(id) {
  const s = session();
  try {
    const result = await s.run(
      `MATCH (i:Ingredient {id: $id})-[r:CONTAINS]->(fc:FlavorCompound)
       OPTIONAL MATCH (other:Ingredient)-[:CONTAINS]->(fc)
       WHERE other <> i
       WITH i, fc, r, collect(DISTINCT {id: other.id, name: other.name, emoji: other.emoji}) AS others
       RETURN i AS ingredient,
              fc AS compound,
              r.amount AS amount,
              others AS sharedWith`,
      { id }
    );

    const nodes = [];
    const edges = [];
    const seenNodes = new Set();

    // Add the central ingredient node
    if (result.records.length > 0) {
      const ing = result.records[0].get('ingredient').properties;
      if (!seenNodes.has(ing.id)) {
        nodes.push({ id: ing.id, label: `${ing.emoji || '●'} ${ing.name}`, type: 'ingredient', central: true });
        seenNodes.add(ing.id);
      }
    }

    for (const record of result.records) {
      const fc = record.get('compound').properties;
      const amount = record.get('amount');
      const sharedWith = record.get('sharedWith');

      if (!seenNodes.has(fc.id)) {
        nodes.push({ id: fc.id, label: fc.name, type: 'compound', aroma: fc.aroma_descriptor });
        seenNodes.add(fc.id);
      }

      const centralId = result.records[0].get('ingredient').properties.id;
      edges.push({ from: centralId, to: fc.id, amount, label: amount });

      // Add neighbor ingredients that share this compound
      for (const other of sharedWith) {
        if (!seenNodes.has(other.id)) {
          nodes.push({ id: other.id, label: `${other.emoji || '●'} ${other.name}`, type: 'neighbor' });
          seenNodes.add(other.id);
        }
        edges.push({ from: other.id, to: fc.id, amount: 'shared' });
      }
    }

    return { nodes, edges };
  } finally {
    await s.close();
  }
}

// Recipes that use a specific ingredient
async function getRecipesByIngredient(id) {
  const s = session();
  try {
    const result = await s.run(
      `MATCH (r:Recipe)-[:USES]->(i:Ingredient {id: $id})
       OPTIONAL MATCH (r)-[:USES]->(other:Ingredient)
       WHERE other.id <> $id
       WITH r, collect(DISTINCT {id: other.id, name: other.name, emoji: other.emoji}) AS otherIngredients
       RETURN r.id AS id,
              r.title AS title,
              r.description AS description,
              r.difficulty AS difficulty,
              r.why_it_works AS why_it_works,
              otherIngredients
       LIMIT 8`,
      { id }
    );
    return result.records.map(r => ({
      id: r.get('id'),
      title: r.get('title'),
      description: r.get('description'),
      difficulty: r.get('difficulty'),
      why_it_works: r.get('why_it_works'),
      otherIngredients: r.get('otherIngredients'),
    }));
  } finally {
    await s.close();
  }
}

// Recipes that specifically feature a pairing of two ingredients
async function getRecipesByPairing(id1, id2) {
  const s = session();
  try {
    const result = await s.run(
      `MATCH (r:Recipe)-[:USES]->(a:Ingredient {id: $id1})
       MATCH (r)-[:USES]->(b:Ingredient {id: $id2})
       RETURN r.id AS id,
              r.title AS title,
              r.description AS description,
              r.difficulty AS difficulty,
              r.why_it_works AS why_it_works`,
      { id1, id2 }
    );
    return result.records.map(r => ({
      id: r.get('id'),
      title: r.get('title'),
      description: r.get('description'),
      difficulty: r.get('difficulty'),
      why_it_works: r.get('why_it_works'),
    }));
  } finally {
    await s.close();
  }
}

// Surprise: a cross-category pairing that still has solid compound overlap
async function getSurprisePairing() {
  const s = session();
  try {
    const result = await s.run(
      `MATCH (a:Ingredient)-[:IN_CATEGORY]->(ca:Category),
             (b:Ingredient)-[:IN_CATEGORY]->(cb:Category)
       WHERE ca <> cb AND id(a) < id(b)
       MATCH (a)-[:CONTAINS]->(fc:FlavorCompound)<-[:CONTAINS]-(b)
       WITH a, b, ca, cb, collect(fc.name) AS shared, count(fc) AS overlap
       WHERE overlap >= 2
       WITH a, b, ca.name AS catA, cb.name AS catB, shared, overlap
       ORDER BY rand()
       LIMIT 1
       RETURN a.id AS aId, a.name AS aName, a.emoji AS aEmoji,
              b.id AS bId, b.name AS bName, b.emoji AS bEmoji,
              catA, catB, shared, overlap`,
      {}
    );
    if (result.records.length === 0) return null;
    const r = result.records[0];
    return {
      a: { id: r.get('aId'), name: r.get('aName'), emoji: r.get('aEmoji'), category: r.get('catA') },
      b: { id: r.get('bId'), name: r.get('bName'), emoji: r.get('bEmoji'), category: r.get('catB') },
      sharedCompounds: r.get('shared'),
      overlap: r.get('overlap').low ?? r.get('overlap'),
    };
  } finally {
    await s.close();
  }
}

// All recipes (for browse page)
async function getAllRecipes() {
  const s = session();
  try {
    const result = await s.run(
      `MATCH (r:Recipe)
       OPTIONAL MATCH (r)-[:USES]->(i:Ingredient)
       WITH r, collect({id: i.id, name: i.name, emoji: i.emoji}) AS ingredients
       RETURN r.id AS id, r.title AS title, r.description AS description,
              r.difficulty AS difficulty, r.why_it_works AS why_it_works, ingredients
       ORDER BY r.title`
    );
    return result.records.map(r => ({
      id: r.get('id'),
      title: r.get('title'),
      description: r.get('description'),
      difficulty: r.get('difficulty'),
      why_it_works: r.get('why_it_works'),
      ingredients: r.get('ingredients').filter(i => i.id !== null),
    }));
  } finally {
    await s.close();
  }
}

module.exports = {
  searchIngredients,
  getIngredient,
  getPairings,
  findBridge,
  getFlavorGraph,
  getRecipesByIngredient,
  getRecipesByPairing,
  getSurprisePairing,
  getAllRecipes,
};
