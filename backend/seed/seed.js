const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const neo4j = require('neo4j-driver');
const ingredients = require('./data/ingredients.json');
const compounds = require('./data/compounds.json');
const recipes = require('./data/recipes.json');

// map of ingredient id -> which compound ids it contains, with amount
const containsMap = {
  'dark-chocolate':   [['pyrazines','dominant'],['furanones','moderate'],['vanillin','trace']],
  'coffee':           [['pyrazines','dominant'],['furanones','moderate'],['diacetyl-lactones','trace']],
  'vanilla':          [['vanillin','dominant'],['eugenol','moderate'],['furanones','moderate'],['diacetyl-lactones','trace']],
  'caramel':          [['furanones','dominant'],['vanillin','moderate'],['diacetyl-lactones','moderate'],['furaneol','trace']],
  'miso':             [['glutamates','dominant'],['pyrazines','moderate'],['furanones','trace']],
  'parmesan':         [['glutamates','dominant'],['diacetyl-lactones','moderate'],['pyrazines','trace']],
  'truffle':          [['1-octen-3-ol','dominant'],['glutamates','moderate'],['guaiacol','trace']],
  'mushroom':         [['1-octen-3-ol','dominant'],['glutamates','moderate']],
  'cardamom':         [['linalool','dominant'],['limonene','moderate'],['eugenol','trace']],
  'lemon':            [['limonene','dominant'],['linalool','moderate']],
  'lavender':         [['linalool','dominant'],['geraniol','moderate']],
  'rose':             [['geraniol','dominant'],['linalool','moderate']],
  'butter':           [['diacetyl-lactones','dominant'],['vanillin','trace']],
  'cream':            [['diacetyl-lactones','dominant'],['vanillin','trace'],['furanones','trace']],
  'strawberry':       [['furaneol','dominant'],['linalool','moderate'],['ethyl-butanoate','moderate']],
  'banana':           [['isoamyl-acetate','dominant'],['eugenol','moderate']],
  'pineapple':        [['ethyl-butanoate','dominant'],['furaneol','moderate'],['isoamyl-acetate','trace']],
  'rum':              [['ethyl-butanoate','moderate'],['isoamyl-acetate','moderate'],['eugenol','moderate'],['vanillin','trace'],['furanones','trace']],
  'cinnamon':         [['cinnamaldehyde','dominant'],['eugenol','moderate'],['linalool','trace']],
  'clove':            [['eugenol','dominant'],['cinnamaldehyde','moderate']],
  'soy-sauce':        [['glutamates','dominant'],['pyrazines','moderate'],['furanones','trace']],
  'anchovy':          [['glutamates','dominant'],['furanones','trace']],
  'honey':            [['furaneol','moderate'],['linalool','moderate'],['geraniol','moderate']],
  'smoked-paprika':   [['guaiacol','dominant'],['pyrazines','moderate']],
  'mezcal':           [['guaiacol','moderate'],['isoamyl-acetate','moderate'],['eugenol','trace']],
  'beetroot':         [['glutamates','moderate'],['1-octen-3-ol','trace']],
  'lapsang-souchong': [['guaiacol','dominant'],['pyrazines','moderate']],
  'yuzu':             [['limonene','dominant'],['linalool','moderate'],['geraniol','trace']],
  'lime':             [['limonene','dominant'],['linalool','moderate']],
  'jasmine':          [['linalool','moderate'],['geraniol','moderate'],['isoamyl-acetate','trace']],
};

const categories = [...new Set(ingredients.map(i => i.category))];
const cuisines = [
  { id: 'european', name: 'European', region: 'Europe' },
  { id: 'japanese', name: 'Japanese', region: 'Asia' },
  { id: 'middle-eastern', name: 'Middle Eastern', region: 'Middle East' },
  { id: 'latin-american', name: 'Latin American', region: 'Americas' },
  { id: 'global', name: 'Global', region: 'Worldwide' },
];

async function seed() {
  const driver = neo4j.driver(
    process.env.COGNODB_URI,
    neo4j.auth.basic(process.env.COGNODB_USER || 'cognodb', process.env.COGNODB_PASSWORD),
    { maxConnectionPoolSize: 5 }
  );

  const session = driver.session();

  try {
    console.log('Connecting to CognoDB...');
    await session.run('RETURN 1');
    console.log('Connected ✓');

    // wipe everything first so the script is idempotent
    console.log('\nClearing existing data...');
    await session.run('MATCH (n) DETACH DELETE n');
    console.log('Cleared ✓');

    // constraints / indexes
    console.log('\nCreating indexes...');
    await session.run('CREATE CONSTRAINT ingredient_id IF NOT EXISTS FOR (i:Ingredient) REQUIRE i.id IS UNIQUE');
    await session.run('CREATE CONSTRAINT compound_id IF NOT EXISTS FOR (f:FlavorCompound) REQUIRE f.id IS UNIQUE');
    await session.run('CREATE CONSTRAINT category_id IF NOT EXISTS FOR (c:Category) REQUIRE c.id IS UNIQUE');
    await session.run('CREATE CONSTRAINT recipe_id IF NOT EXISTS FOR (r:Recipe) REQUIRE r.id IS UNIQUE');
    console.log('Indexes ✓');

    // categories
    console.log('\nSeeding categories...');
    for (const cat of categories) {
      await session.run(
        'MERGE (c:Category {id: $id, name: $name})',
        { id: cat.toLowerCase().replace(/\s+/g, '-'), name: cat }
      );
    }
    console.log(`  ${categories.length} categories ✓`);

    // flavor compounds
    console.log('\nSeeding flavor compounds...');
    for (const fc of compounds) {
      await session.run(
        `MERGE (fc:FlavorCompound {id: $id})
         SET fc.name = $name, fc.chemical_class = $chemical_class, fc.aroma_descriptor = $aroma_descriptor`,
        fc
      );
    }
    console.log(`  ${compounds.length} compounds ✓`);

    // ingredients
    console.log('\nSeeding ingredients...');
    for (const ing of ingredients) {
      await session.run(
        `MERGE (i:Ingredient {id: $id})
         SET i.name = $name, i.description = $description, i.origin = $origin, i.emoji = $emoji`,
        { id: ing.id, name: ing.name, description: ing.description, origin: ing.origin, emoji: ing.emoji }
      );
      // category relationship
      const catId = ing.category.toLowerCase().replace(/\s+/g, '-');
      await session.run(
        `MATCH (i:Ingredient {id: $ingId}), (c:Category {id: $catId})
         MERGE (i)-[:IN_CATEGORY]->(c)`,
        { ingId: ing.id, catId }
      );
    }
    console.log(`  ${ingredients.length} ingredients ✓`);

    // CONTAINS relationships
    console.log('\nSeeding CONTAINS relationships...');
    let containsCount = 0;
    for (const [ingId, compoundList] of Object.entries(containsMap)) {
      for (const [compId, amount] of compoundList) {
        await session.run(
          `MATCH (i:Ingredient {id: $ingId}), (fc:FlavorCompound {id: $compId})
           MERGE (i)-[r:CONTAINS]->(fc)
           SET r.amount = $amount`,
          { ingId, compId, amount }
        );
        containsCount++;
      }
    }
    console.log(`  ${containsCount} CONTAINS edges ✓`);

    // PAIRS_WITH — derived from compound overlap (this is the graph doing what graphs do best)
    console.log('\nDeriving PAIRS_WITH relationships from compound overlap...');
    const pairsResult = await session.run(
      `MATCH (a:Ingredient)-[:CONTAINS]->(fc:FlavorCompound)<-[:CONTAINS]-(b:Ingredient)
       WHERE id(a) < id(b)
       WITH a, b, collect(fc.name) AS sharedCompounds, count(fc) AS overlap
       WHERE overlap >= 1
       MERGE (a)-[p:PAIRS_WITH]-(b)
       SET p.score = overlap, p.sharedCompounds = sharedCompounds
       RETURN count(p) AS created`
    );
    const pairsCreated = pairsResult.records[0].get('created');
    console.log(`  ${pairsCreated} PAIRS_WITH edges ✓`);

    // recipes
    console.log('\nSeeding recipes...');
    for (const recipe of recipes) {
      await session.run(
        `MERGE (r:Recipe {id: $id})
         SET r.title = $title, r.description = $description,
             r.difficulty = $difficulty, r.why_it_works = $why_it_works`,
        { id: recipe.id, title: recipe.title, description: recipe.description, difficulty: recipe.difficulty, why_it_works: recipe.why_it_works }
      );
      for (const ingId of recipe.ingredients) {
        await session.run(
          `MATCH (r:Recipe {id: $recipeId}), (i:Ingredient {id: $ingId})
           MERGE (r)-[:USES]->(i)`,
          { recipeId: recipe.id, ingId }
        );
      }
    }
    console.log(`  ${recipes.length} recipes ✓`);

    console.log('\n✅ Seed complete! TasteGraph is ready.');

    const ingCount = await session.run('MATCH (i:Ingredient) RETURN count(i) AS n');
    const fcCount  = await session.run('MATCH (fc:FlavorCompound) RETURN count(fc) AS n');
    const rCount   = await session.run('MATCH (r:Recipe) RETURN count(r) AS n');
    const pCount   = await session.run('MATCH ()-[p:PAIRS_WITH]-() RETURN count(p) AS n');

    console.log('\nDatabase summary:');
    console.log(`  Ingredients:      ${ingCount.records[0].get('n')}`);
    console.log(`  Flavor Compounds: ${fcCount.records[0].get('n')}`);
    console.log(`  Recipes:          ${rCount.records[0].get('n')}`);
    console.log(`  Pairings:         ${pCount.records[0].get('n')}`);

  } catch (err) {
    console.error('\n❌ Seed failed:', err.message);
    process.exit(1);
  } finally {
    await session.close();
    await driver.close();
  }
}

seed();
