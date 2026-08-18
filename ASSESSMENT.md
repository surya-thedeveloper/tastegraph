# Wexa AI Assessment — Implementation Plan
## App: TasteGraph — Flavor Pairing Explorer

---

## What Is This?

A web app that maps **flavor connections between ingredients** using graph data.
Users can search an ingredient and discover why it pairs well with others — based on shared
aromatic flavor compounds. The graph makes recommendations that feel almost magical:
"Why does chocolate go with coffee?" — because they share pyrazines and furans.

This is real food science (based on Yong-Yeol Ahn's 2011 flavor network paper).
The graph database earns its place here because these are genuine many-to-many
compound relationships — not something a SQL schema handles gracefully.

---

## Why a Graph Database?

- Ingredients share flavor compounds (many-to-many)
- Flavor compounds connect ingredients across surprising cultural boundaries
- "Find me all ingredients that share at least 2 compounds with miso" is a 2-hop traversal
- Recommendation: "ingredients that pair with X because they share Y compounds with Z" — natural Cypher, awful SQL
- The data IS a graph — forcing it into tables loses the relational meaning

---

## Use Case: TasteGraph

**Core user journey:**
1. User searches an ingredient (e.g. "dark chocolate")
2. App shows the ingredient's flavor compounds
3. App shows other ingredients that share those compounds — ranked by overlap
4. User can click any pairing to see WHY it works (shared compounds highlighted)
5. User can explore recipes that use those pairings
6. Bonus: "Surprise me" — finds the most unexpected valid pairing in the graph

---

## Data Model

```
(Ingredient)-[:CONTAINS {amount: "trace|moderate|dominant"}]->(FlavorCompound)
(Ingredient)-[:PAIRS_WITH {score: int, reason: string}]->(Ingredient)
(Recipe)-[:USES]->(Ingredient)
(Recipe)-[:BELONGS_TO]->(Cuisine)
(Ingredient)-[:IN_CATEGORY]->(Category)
```

### Nodes

| Label | Properties |
|-------|-----------|
| `Ingredient` | `id`, `name`, `description`, `image_hint`, `origin` |
| `FlavorCompound` | `id`, `name`, `chemical_class`, `aroma_descriptor` |
| `Recipe` | `id`, `title`, `description`, `difficulty`, `cuisine` |
| `Category` | `id`, `name` (e.g. "dairy", "spice", "citrus", "TasteGraph") |
| `Cuisine` | `id`, `name`, `region` |

### Key Relationships

| Relationship | Properties |
|-------------|-----------|
| `CONTAINS` | `amount` ("trace", "moderate", "dominant") |
| `PAIRS_WITH` | `score` (1-10), `reason` (short text) |
| `USES` | `quantity` (optional) |
| `BELONGS_TO` | — |
| `IN_CATEGORY` | — |

---

## Key Cypher Queries

### 1. Multi-hop: Find pairing candidates (2 hops through compounds)
```cypher
MATCH (a:Ingredient {name: $name})-[:CONTAINS]->(fc:FlavorCompound)<-[:CONTAINS]-(b:Ingredient)
WHERE a <> b
WITH b, collect(fc.name) AS sharedCompounds, count(fc) AS overlap
ORDER BY overlap DESC
RETURN b.name, sharedCompounds, overlap
LIMIT 10
```

### 2. Awkward in SQL: Shortest flavor bridge between two ingredients
```cypher
MATCH path = shortestPath(
  (a:Ingredient {name: $from})-[:PAIRS_WITH*..6]-(b:Ingredient {name: $to})
)
RETURN [n IN nodes(path) | n.name] AS bridge, length(path) AS hops
```

### 3. Compound profile of an ingredient
```cypher
MATCH (i:Ingredient {name: $name})-[r:CONTAINS]->(fc:FlavorCompound)
RETURN fc.name, fc.aroma_descriptor, r.amount
ORDER BY r.amount DESC
```

### 4. Recipes using a pairing
```cypher
MATCH (r:Recipe)-[:USES]->(a:Ingredient {name: $ing1})
MATCH (r)-[:USES]->(b:Ingredient {name: $ing2})
RETURN r.title, r.description, r.difficulty
```

---

## Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Backend | Node.js + Express | Straightforward, good neo4j-driver support |
| Frontend | React + Vite | Component model suits the ingredient cards well |
| Styling | Vanilla CSS (no Tailwind) | Full control over the earthy food aesthetic |
| DB Driver | `neo4j-driver` (official) | Required by spec |
| Graph viz | `vis-network` | Lightweight, renders the compound network nicely |
| Hosting | Render (backend) + Vercel (frontend) | Both free tier |

---

## Project Structure

```
TasteGraph/
├── backend/
│   ├── src/
│   │   ├── db/
│   │   │   ├── driver.js        # CognoDB connection
│   │   │   └── queries.js       # All Cypher queries (parameterised)
│   │   ├── routes/
│   │   │   ├── ingredients.js
│   │   │   ├── pairings.js
│   │   │   ├── recipes.js
│   │   │   └── graph.js
│   │   ├── middleware/
│   │   │   └── errorHandler.js
│   │   └── index.js
│   ├── seed/
│   │   ├── data/
│   │   │   ├── ingredients.json
│   │   │   ├── compounds.json
│   │   │   └── recipes.json
│   │   └── seed.js
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── SearchBar.jsx
│   │   │   ├── IngredientCard.jsx
│   │   │   ├── PairingCard.jsx
│   │   │   ├── FlavorGraph.jsx    # vis-network canvas
│   │   │   ├── RecipeCard.jsx
│   │   │   └── ErrorBanner.jsx
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Ingredient.jsx     # /ingredient/:name
│   │   │   └── Bridge.jsx         # /bridge — two-ingredient path finder
│   │   ├── api/
│   │   │   └── client.js          # fetch wrapper with error handling
│   │   ├── styles/
│   │   │   ├── globals.css
│   │   │   ├── components.css
│   │   │   └── pages.css
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   └── package.json
├── README.md
├── ASSESSMENT.md
└── .gitignore
```

---

## UI Aesthetic

**Palette:**
- Background: `#1a1612` (very dark warm brown)
- Surface: `#2a2118` (dark olive-brown)
- Card: `#332b1e` (warm dark tan)
- Accent: `#d4a843` (amber/turmeric)
- Text primary: `#f0e8d6` (warm cream)
- Text muted: `#9a8a70` (muted sand)
- Highlight: `#c8622a` (burnt sienna for "hot" pairings)

**Typography:**
- Headers: `Playfair Display` (Google Fonts — editorial, food-magazine feel)
- Body: `Inter` (clean, readable)
- Mono: system-ui monospace for compound names

**Tone:**
- Personal, curious copy ("Ever wondered why miso and chocolate work?")
- "Surprise me" button with unpredictable results
- Loading state: "Checking the flavor network..."
- Empty state: "Nothing here yet — try 'coffee' or 'cardamom'"

---

## Seed Data Plan

~30 ingredients across categories:
- Dairy: parmesan, butter, cream
- Spice: cardamom, cumin, cinnamon, vanilla
- Citrus: lemon, lime, yuzu
- TasteGraph: miso, soy sauce, anchovy, parmesan
- Sweet: dark chocolate, honey, caramel
- Earthy: truffle, mushroom, beetroot
- Floral: lavender, rose water, jasmine
- Smoke: smoked paprika, mezcal, lapsang souchong

~60 flavor compounds:
- Pyrazines (roasted/nutty): in coffee, chocolate, miso
- Furans (caramel): in vanilla, caramel, coffee
- Terpenes (citrus/floral): in cardamom, lemon, lavender
- Sulfur compounds (savory): in truffle, miso, garlic
- Lactones (creamy): in butter, cream, peach
- Esters (fruity): in rum, banana, pineapple

~20 recipes:
- Miso chocolate chip cookies
- Cardamom rose latte
- Truffle parmesan pasta
- Lemon lavender shortbread
- Smoked paprika honey glaze
...

---

## Your Steps (Before I Build)

### Step 1 — CognoDB
1. Sign up: **https://console.cognodb.com/signup**
2. Create a free **c0** instance (any region)
3. Save the `bolt+s://` URI and the password (shown **once only**)

### Step 2 — GitHub
1. Create a new public repo, name it **`TasteGraph`** (or whatever you like)

### Step 3 — Tell Me
Reply with:
- CognoDB `bolt+s://` URI
- CognoDB password
- GitHub repo URL
- Your full name (for the email subject line)

### Step 4 — I Build Everything
I'll write all the code, push-ready.

### Step 5 — You Deploy
I'll walk you through deploying backend to Render + frontend to Vercel (both free, takes ~10 mins).

### Step 6 — Record & Submit
2-min screen recording → email to hr@wexa.ai

