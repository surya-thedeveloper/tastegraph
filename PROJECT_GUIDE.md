# TasteGraph — Master Explanation & Interview Guide

> **Welcome!** If you feel like you "know nothing" about graph databases or how this app was built, don't worry. This guide explains **everything** in simple, plain English so you can understand the project, deploy it, and answer interview questions with confidence.

---

## Table of Contents
1. [What is TasteGraph? (The Big Picture)](#1-what-is-tastegraph-the-big-picture)
2. [Why a Graph Database? (Crucial for your evaluation)](#2-why-a-graph-database-crucial-for-your-evaluation)
3. [The Data Model Explained Simply](#3-the-data-model-explained-simply)
4. [The 4 Main Cypher Queries (How the backend talks to CognoDB)](#4-the-4-main-cypher-queries)
5. [Code Architecture (What every file does)](#5-code-architecture-what-every-file-does)
6. [How to Deploy (Step-by-Step for Beginners)](#6-how-to-deploy-step-by-step-for-beginners)
7. [How to Record Your Demo Video](#7-how-to-record-your-demo-video)
8. [Submission Email Template](#8-submission-email-template)

---

## 1. What is TasteGraph? (The Big Picture)

**TasteGraph** is a web application that helps people discover why certain food ingredients taste great together based on **real food chemistry**.

- **The Core Idea:** Foods pair well together when they share volatile aromatic compounds (flavor molecules).
- **Example 1:** Dark Chocolate and Coffee pair well because both roasting processes produce **pyrazines** (roasted/nutty compounds).
- **Example 2:** Cardamom and Lavender pair well because both contain **linalool** (a floral citrus terpene).
- **Example 3 (The "Bridge"):** Dark Chocolate doesn't share compounds directly with Lavender, but Chocolate connects to Vanilla, Vanilla connects to Cardamom, and Cardamom connects to Lavender! That is a **3-hop path** in a graph network.

---

## 2. Why a Graph Database? (Crucial for your evaluation)

Wexa's assignment explicitly requires you to explain **"Why a graph database over a relational database (SQL)?"**

Here is what you say in an interview:

> *"In a SQL (relational) database, data is stored in flat tables. If you want to find ingredients that share compounds, or calculate the shortest path between two ingredients, SQL requires complex junction tables, multiple self-joins, or slow recursive queries.*  
>  
> *In a Graph Database like CognoDB, connections (relationships) are first-class citizens stored directly alongside nodes. Finding shared compounds is a natural 2-hop traversal (`Ingredient -> Compound <- Ingredient`), and finding the shortest chain between chocolate and lavender takes a single line of Cypher code (`shortestPath`)."*

---

## 3. The Data Model Explained Simply

Think of the graph as a web of dots (Nodes) connected by strings (Relationships):

```
       (Ingredient) ─── [:CONTAINS] ───> (FlavorCompound)
            │                                   │
      [:IN_CATEGORY]                      [:CONTAINS]
            │                                   │
            ▼                                   ▼
        (Category)                         (Ingredient)
            ▲
            │
         (Recipe) ──── [:USES] ────> (Ingredient)
```

- **Nodes (The Dots):**
  - `Ingredient`: e.g., Dark Chocolate, Miso, Truffle, Lavender (30 items)
  - `FlavorCompound`: e.g., Pyrazines, Glutamates, Linalool (15 chemical compounds)
  - `Recipe`: e.g., Miso Chocolate Chip Cookies (15 recipes)
  - `Category`: e.g., Roasted, Umami, Floral, Citrus (10 categories)

- **Relationships (The Strings):**
  - `(:Ingredient)-[:CONTAINS]->(:FlavorCompound)` (e.g. Coffee contains Pyrazines)
  - `(:Ingredient)-[:PAIRS_WITH]->(:Ingredient)` (derived automatically when 2 ingredients share compounds)
  - `(:Recipe)-[:USES]->(:Ingredient)` (e.g. Miso Chocolate Cookies uses Dark Chocolate and Miso)

---

## 4. The 4 Main Cypher Queries

All database queries are located in `backend/src/db/queries.js`. They use **openCypher** syntax with parameterized variables (preventing Cypher injection).

### Query 1: 2-Hop Pairing Finder (Multi-hop requirement)
```cypher
MATCH (a:Ingredient {id: $id})-[:CONTAINS]->(fc:FlavorCompound)<-[:CONTAINS]-(b:Ingredient)
WHERE a <> b
WITH b, collect(fc.name) AS sharedCompounds, count(fc) AS overlap
ORDER BY overlap DESC
RETURN b.id, b.name, sharedCompounds, overlap
```
**What it does:** Starts at an ingredient (`a`), traverses to all its compounds (`fc`), then traverses to any other ingredient (`b`) that contains those same compounds.

### Query 2: Shortest Path Finder (SQL-Awkward requirement)
```cypher
MATCH (a:Ingredient {id: $fromId}), (b:Ingredient {id: $toId})
MATCH path = shortestPath((a)-[:PAIRS_WITH*..8]-(b))
RETURN [n IN nodes(path) | {id: n.id, name: n.name}] AS bridge, length(path) AS hops
```
**What it does:** Finds the shortest chain of pairings connecting any two ingredients up to 8 steps away.

### Query 3: Random Cross-Category Surprise Match
```cypher
MATCH (a:Ingredient)-[:IN_CATEGORY]->(ca:Category),
      (b:Ingredient)-[:IN_CATEGORY]->(cb:Category)
WHERE ca <> cb AND id(a) < id(b)
MATCH (a)-[:CONTAINS]->(fc:FlavorCompound)<-[:CONTAINS]-(b)
WITH a, b, ca.name AS catA, cb.name AS catB, collect(fc.name) AS shared, count(fc) AS overlap
WHERE overlap >= 2
RETURN a, b, shared, overlap
LIMIT 1
```
**What it does:** Picks a random pairing between two ingredients from *different* food categories that share at least 2 compounds.

---

## 5. Code Architecture (What every file does)

```
wexaAssessment/
├── backend/                  # Express Node.js Server
│   ├── src/
│   │   ├── db/
│   │   │   ├── driver.js     # Connects to CognoDB via official Neo4j bolt driver
│   │   │   └── queries.js    # All Cypher query functions
│   │   ├── routes/           # REST API endpoints (/api/ingredients, /api/pairings, /api/graph)
│   │   ├── middleware/       # Error handling (graceful CognoDB connection error fallback)
│   │   └── index.js          # Express app entry point
│   ├── seed/
│   │   ├── data/             # JSON files for ingredients, compounds, recipes
│   │   └── seed.js           # Database seed script (populates CognoDB)
│   └── package.json
│
├── frontend/                 # React + Vite Web Application
│   ├── src/
│   │   ├── api/client.js     # Fetch helper talking to Express API
│   │   ├── components/       # Reusable UI components
│   │   │   ├── FlavorGraph.jsx  # Interactive vis-network node graph canvas
│   │   │   ├── IngredientCard.jsx
│   │   │   ├── PairingCard.jsx
│   │   │   ├── RecipeCard.jsx
│   │   │   ├── SearchBar.jsx
│   │   │   └── Layout.jsx
│   │   ├── pages/            # App screens
│   │   │   ├── Home.jsx      # Main Explorer page (search, category filter, random match)
│   │   │   ├── Ingredient.jsx# Ingredient detail (compounds, graph canvas, 2-hop pairs)
│   │   │   └── Bridge.jsx    # Shortest path calculator
│   │   ├── styles/           # Clean custom CSS stylesheets (globals.css, components.css)
│   │   ├── App.jsx           # React router routes setup
│   │   └── main.jsx          # React app mounting script
│   └── package.json
│
├── screenshots/              # UI screenshots used in README
├── README.md                 # Assignment documentation & setup instructions
├── ASSESSMENT.md             # Detailed specification checklist
├── CONTEXT.md                # Development log
└── PROJECT_GUIDE.md          # This guide!
```

---

## 6. How to Deploy (Step-by-Step for Beginners)

You need to host two things (both are completely **free**):
1. **Backend (Node.js API)** → Hosted on **Render.com**
2. **Frontend (React UI)** → Hosted on **Vercel.com**

---

### Step 6.1: Deploy Backend to Render.com (3 minutes)

1. Open [dashboard.render.com](https://dashboard.render.com/) (Sign in with your GitHub account).
2. Click **New +** → **Web Service**.
3. Select your GitHub repository: **`surya-thedeveloper/tastegraph`**.
4. Fill in these exact settings:
   - **Name:** `tastegraph-backend`
   - **Region:** Any (e.g., Singapore or Oregon)
   - **Root Directory:** `backend`
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `node src/index.js`
   - **Instance Type:** `Free`
5. Scroll down to **Environment Variables** and click **Add Environment Variable** for each:
   - Key: `COGNODB_URI` | Value: `bolt+s://db-99baf1ab.databases.cognodb.com`
   - Key: `COGNODB_USER` | Value: `cognodb`
   - Key: `COGNODB_PASSWORD` | Value: `bf441811465217d0ccfb25f657c05f05`
   - Key: `PORT` | Value: `3001`
   - Key: `FRONTEND_URL` | Value: `*`
6. Click **Create Web Service**.
7. Wait 2 minutes for Render to finish building. Once ready, copy your backend URL (e.g. `https://tastegraph-backend.onrender.com`).

---

### Step 6.2: Deploy Frontend to Vercel.com (2 minutes)

1. Open [vercel.com/new](https://vercel.com/new) (Sign in with your GitHub account).
2. Click **Import** next to **`surya-thedeveloper/tastegraph`**.
3. Configure settings:
   - **Framework Preset:** `Vite`
   - **Root Directory:** Click **Edit** and set it to **`frontend`**
4. Expand **Environment Variables**:
   - Key: `VITE_API_URL`
   - Value: `https://tastegraph-backend.onrender.com` *(Paste your Render backend URL from Step 6.1)*
5. Click **Deploy**.
6. In about 45 seconds, Vercel will give you your live demo link (e.g. `https://tastegraph.vercel.app`).

---

## 7. How to Record Your Demo Video

Wexa requires a short screen recording (1 to 2 minutes).

### Recording Steps:
1. Open your live Vercel URL in your browser.
2. Use **Windows Game Bar** (Press `Win + G` and click Record) or **Loom.com**.
3. Walk through these 4 quick actions while speaking (or silent with captions):
   - **Home Page:** Type `coffee` in the search bar to show instant filtering.
   - **Detail Page:** Click on **Coffee** or **Dark Chocolate**. Point out the **Flavor Compounds** list, the interactive **vis-network graph**, and the **2-Hop Pairings**.
   - **Shortest Path Page:** Click **Shortest Path** in the top navigation bar. Select *Dark Chocolate* and *Lavender*, then click **Find Shortest Path** to show the Cypher `shortestPath` traversal result.
   - **Random Match:** Return home and click **🎲 Random Cross-Category Match**.
4. Save the video and upload it to Loom, YouTube (Unlisted), or Google Drive (Set access to "Anyone with link can view").

---

## 8. Submission Email Template

Copy and paste this email to **`hr@wexa.ai`**:

```text
To: hr@wexa.ai
Subject: CognoDB Assignment 2 — Surya Prasad

Hi Wexa AI Team,

Please find my submission for the CognoDB Graph Database Application assignment below.

- GitHub Repository: https://github.com/surya-thedeveloper/tastegraph
- Hosted Demo URL: https://tastegraph.vercel.app (Replace with your actual Vercel link)
- Screen Recording: [Insert Loom / Google Drive link]

Project Highlights:
- Application Idea: TasteGraph — a food science flavor pairing explorer backed by CognoDB (openCypher).
- Graph Data Model: 30 Ingredients, 15 Flavor Compounds, 15 Recipes, and 159 derived PAIRS_WITH edges.
- Cypher Queries: Parameterized multi-hop traversals (Ingredient -> Compound <- Ingredient) and native shortestPath calculations.
- Tech Stack: Node.js + Express backend (official neo4j-driver), React + Vite frontend with vis-network graph visualization.

The CognoDB database instance is live and running.

Best regards,
Surya Prasad
```
