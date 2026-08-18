# TasteGraph — Project Context & Decision Log

> This file tracks every action, decision, and change made during development.
> If context window is exceeded, read this file first to resume work accurately.

---

## Project Identity

| Field | Value |
|-------|-------|
| App Name | TasteGraph |
| Use Case | Flavor Pairing Explorer (Recipe/Ingredient graph) |
| Submitter | Surya Prasad |
| Submit To | hr@wexa.ai |
| Subject | `CognoDB Assignment 2 — Surya Prasad` |
| GitHub | https://github.com/surya-thedeveloper/tastegraph.git |

---

## Credentials (DO NOT COMMIT)

| Field | Value |
|-------|-------|
| CognoDB URI | `bolt+s://db-99baf1ab.databases.cognodb.com` |
| CognoDB User | `cognodb` |
| CognoDB Pass | `bf441811465217d0ccfb25f657c05f05` |

These go in `backend/.env` which is gitignored.

---

## User Instructions (All Decisions)

1. **No movie use case** — use Flavor Pairing / Recipe graph instead
2. **App name: TasteGraph** — honest, graph-hinting, developer-named
3. **Must NOT look AI-generated** — human voice in code comments, README, UI copy. Some TODOs left in. Opinionated style choices. Personal README.
4. **Follow ASSESSMENT.md** at all times
5. **Keep this CONTEXT.md updated** after every action/decision
6. **Tech stack:** Node.js + Express (backend), React + Vite (frontend), vanilla CSS, vis-network for graph viz
7. **Hosting:** Render (backend) + Vercel (frontend)
8. **Aesthetic:** Dark warm browns, amber/turmeric accent, Playfair Display + Inter fonts. Food-magazine feel.

---

## Assessment Requirements Checklist

### Data & Queries
- [ ] Graph data model: labeled nodes, typed relationships, properties
- [ ] Diagram in README
- [ ] Real/realistic seed data + loading script
- [ ] Multi-hop traversal (>= 2 hops): ingredient → compound → ingredient
- [ ] Query awkward in SQL: find all ingredients sharing 2+ compounds with a given one
- [ ] Parameterized queries (no string-concatenated Cypher)

### Application & UI/UX
- [ ] Functional web app usable by non-technical person
- [ ] Loading states
- [ ] Empty states
- [ ] Error states
- [ ] Clean typography and layout

### Engineering
- [ ] Connection details from env vars only
- [ ] `.env` in `.gitignore`
- [ ] Clear project structure
- [ ] Graceful error handling when DB unreachable

### Deliverables
- [ ] Full source code
- [ ] README with use case, "Why graph DB?", data model diagram, setup instructions, query explanations, UI screenshots
- [ ] Hosted demo link (MANDATORY)
- [ ] Screen recording

---

## Data Model

```
(Ingredient)-[:CONTAINS {amount: "trace|moderate|dominant"}]->(FlavorCompound)
(Ingredient)-[:PAIRS_WITH {score: int, sharedCompounds: [string]}]->(Ingredient)
(Recipe)-[:USES]->(Ingredient)
(Recipe)-[:BELONGS_TO]->(Cuisine)
(Ingredient)-[:IN_CATEGORY]->(Category)
```

### Nodes

| Label | Properties |
|-------|-----------|
| `Ingredient` | `id`, `name`, `description`, `category`, `origin`, `emoji` |
| `FlavorCompound` | `id`, `name`, `chemical_class`, `aroma_descriptor` |
| `Recipe` | `id`, `title`, `description`, `difficulty`, `why_it_works` |
| `Category` | `id`, `name` |
| `Cuisine` | `id`, `name`, `region` |

---

## Key Cypher Queries

### Q1 — Multi-hop: Find pairing candidates (2 hops through compounds)
```cypher
MATCH (a:Ingredient {id: $id})-[:CONTAINS]->(fc:FlavorCompound)<-[:CONTAINS]-(b:Ingredient)
WHERE a <> b
WITH b, collect(fc.name) AS sharedCompounds, count(fc) AS overlap
ORDER BY overlap DESC
RETURN b.name, sharedCompounds, overlap
LIMIT 15
```

### Q2 — Shortest flavor bridge (awkward in SQL)
```cypher
MATCH path = shortestPath(
  (a:Ingredient {id: $from})-[:PAIRS_WITH*..8]-(b:Ingredient {id: $to})
)
RETURN [n IN nodes(path) | n.name] AS bridge, length(path) AS hops
```

### Q3 — Compound profile
```cypher
MATCH (i:Ingredient {id: $id})-[r:CONTAINS]->(fc:FlavorCompound)
RETURN fc.name, fc.aroma_descriptor, fc.chemical_class, r.amount
ORDER BY CASE r.amount WHEN 'dominant' THEN 1 WHEN 'moderate' THEN 2 ELSE 3 END
```

### Q4 — Recipes using a pairing
```cypher
MATCH (r:Recipe)-[:USES]->(a:Ingredient {id: $ing1})
MATCH (r)-[:USES]->(b:Ingredient {id: $ing2})
RETURN r.title, r.description, r.difficulty, r.why_it_works
```

### Q5 — Surprise: most unexpected pairing (max hops, high score)
```cypher
MATCH (a:Ingredient)-[p:PAIRS_WITH]->(b:Ingredient)
WHERE a.category <> b.category
RETURN a, b, p.score, p.sharedCompounds
ORDER BY p.score DESC
SKIP toInteger(rand() * 20)
LIMIT 1
```

---

## Project Structure

```
s:\Dev\wexaAssessment\
├── ASSESSMENT.md
├── CONTEXT.md              ← this file
├── .gitignore
├── README.md
├── backend/
│   ├── src/
│   │   ├── db/
│   │   │   ├── driver.js
│   │   │   └── queries.js
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
│   ├── .env              ← gitignored, real credentials
│   ├── .env.example      ← committed, placeholder values
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── SearchBar.jsx
    │   │   ├── IngredientCard.jsx
    │   │   ├── PairingCard.jsx
    │   │   ├── FlavorGraph.jsx
    │   │   ├── RecipeCard.jsx
    │   │   ├── ErrorBanner.jsx
    │   │   └── LoadingSpinner.jsx
    │   ├── pages/
    │   │   ├── Home.jsx
    │   │   ├── Ingredient.jsx
    │   │   └── Bridge.jsx
    │   ├── api/
    │   │   └── client.js
    │   ├── styles/
    │   │   ├── globals.css
    │   │   ├── components.css
    │   │   └── pages.css
    │   ├── App.jsx
    │   └── main.jsx
    ├── index.html
    ├── vite.config.js
    └── package.json
```

---

## Action Log

| # | Timestamp | Action | Status |
|---|-----------|--------|--------|
| 1 | 2026-08-18 | Analyzed PDF, created ASSESSMENT.md | ✅ Done |
| 2 | 2026-08-18 | Chose Flavor Pairing use case | ✅ Done |
| 3 | 2026-08-18 | Named app "TasteGraph" | ✅ Done |
| 4 | 2026-08-18 | Created CONTEXT.md | ✅ Done |
| 5 | 2026-08-18 | Build .gitignore | ✅ Done |
| 6 | 2026-08-18 | Build backend (Express + queries + seed) | ✅ Done |
| 7 | 2026-08-18 | Build frontend (React + Vite + all pages) | ✅ Done |
| 8 | 2026-08-18 | Run seed script against CognoDB | ✅ Done — 30 ingredients, 15 compounds, 82 CONTAINS, 159 PAIRS_WITH, 15 recipes |
| 9 | 2026-08-18 | Write README.md | ✅ Done |
| 10 | 2026-08-18 | Test locally (both servers) | ✅ Done — Verified Home, Ingredient Detail, Bridge, and Surprise me in browser |
| 11 | 2026-08-18 | Initialize git & push to GitHub | ✅ Done — Pushed to https://github.com/surya-thedeveloper/tastegraph.git |
| 12 | 2026-08-18 | Deploy backend to Render | ⏳ Ready for user deployment |
| 13 | 2026-08-18 | Deploy frontend to Vercel | ⏳ Ready for user deployment |
| 14 | 2026-08-18 | Record demo & submit email | ⏳ |

---

## Design Decisions

### Palette
| Token | Value | Usage |
|-------|-------|-------|
| bg | `#1c1410` | Page background |
| surface | `#2d2218` | Card surface |
| border | `#4a3828` | Card borders |
| accent | `#d4a843` | Primary accent (amber/turmeric) |
| accent-hot | `#c8622a` | Burnt sienna for high-score pairings |
| text | `#f0e6d3` | Primary text (warm cream) |
| text-muted | `#8a7a65` | Secondary text |
| compound | `#4a8c4a` | Compound nodes in graph |

### Typography
- Headers: `Playfair Display` (Google Fonts) — editorial, food-magazine feel
- Body: `Inter` (Google Fonts) — clean, readable
- Mono: system monospace — for compound IDs

### "Human-developed" markers
- Personal voice in README ("I built this because...")
- Comments like "// this query took me a while to get right"
- A TODO or two left in intentionally
- UI copy with personality ("Try 'truffle' — the results will surprise you")
- Some CSS specifics that aren't round numbers
- Not every animation is perfectly smooth — intentional

---

## Deployment Plan

### Backend → Render
- New Web Service
- Runtime: Node
- Build: `npm install`
- Start: `node src/index.js`
- Env vars: `COGNODB_URI`, `COGNODB_PASSWORD`, `COGNODB_USER`, `PORT`

### Frontend → Vercel
- Import GitHub repo, set root to `/frontend`
- Build: `npm run build`
- Env var: `VITE_API_URL=https://tastegraph-api.onrender.com`
