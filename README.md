# MLKN.lab — MultiLayer Knowledge Network Ideas Laboratory

**Interactive D3 force-directed knowledge network maps across 26 academic disciplines.**

🌐 **Live site:** [francoispapin.github.io/mlkn-lab](https://francoispapin.github.io/mlkn-lab/)
📚 **Author:** [François Papin](https://www.linkedin.com/in/francoispapin/)
🐙 **GitHub:** [github.com/FrancoisPapin](https://github.com/FrancoisPapin)
📄 **License:** MIT License | © April 2026

---

## Overview

MLKN.lab visualises the conceptual architecture of 26 academic disciplines as interactive force-directed networks built on D3.js v7. Each concept is a node (sized by academic centrality), each connection a weighted edge. The interdisciplinary map adds five ontological Core Layers (Layer 1: Core Disciplines Domaines ; Layer 2: Academic Disciplines ; Layer 3: Academic Subdisciplines; Layer 4: Core Thematic Domains; Layer 5: Main Thematics) and the multiple epistemological Meta-Layers: the five Epistemic Layers (Basic Research, Applied Research, Experimental Development, Normative Research, Meta-Research); the five Levels of Analysis (Molecular-Neural, Individual, Population, Social-Cultural, System-Global); the three Paradigms (Reductionnist, Holistic, Critical). — mapping the bridges between fields that produce the most scientifically generative knowledge.

### Scientific Essay Summary

The twenty-first century's major challenges are structurally interdisciplinary. Network analysis of academic knowledge reveals that concepts with highest betweenness centrality — lying on paths between disciplinary clusters — generate disproportionate scientific value (Van Noorden, 2015; Leydesdorff & Rafols, 2011). MLKN.lab maps this landscape, identifying major interdisciplinary nexuses: Neuro-Cognitive-Education, AI-Language-Philosophy, Climate-Justice-Anthropology, and Systems-Emergence-Consciousness. See the full essay on the [homepage](https://francoispapin.github.io/mlkn-lab/).

---

## Knowledge Networks

| # | Discipline | Concepts | Links |
|---|-----------|---------|-------|
| 01 | Mathematical Science | ??? | ??? |
| 02 | Computer Science | ??? | ??? |
| 03 | Logic | ??? | ??? |
| 04 | Systems Science | ??? | ??? |
| 05 | Neuroscience | ??? | ??? |
| 06 | Environmental Science | ??? | ??? |
| 07 | Biology | ??? | ??? |
| 08 | Medicine | ??? | ??? |
| 09 | Public Health | ??? | ??? |
| 10 | Bioethics | ??? | ??? |
| 11 | Anthropology | ??? | ??? |
| 12 | Law | ??? | ??? |
| 13 | Education Science | ??? | ??? |
| 14 | Economics | ??? | ??? |
| 15 | Psychology | ??? | ??? |
| 16 | Sociology | ??? | ??? |
| 17 | Digital Geopolitics | ??? | ??? |
| 18 | Philosophy | ??? | ??? |
| 19 | Language Science | ??? | ??? |
| 20 | Social Epistemology | ??? | ??? |
| 21 | History of Science | ??? | ??? |
| 22 | Art and Design | ??? | ??? |
| 23 | Engineering | ??? | ??? |
| 24 | Design | ??? | ??? |
| 25 | Urban Planning | ??? | ??? |
| 26 | Architecture | ??? | ??? |
| 27 | **Interdisciplinary** | ??? | ??? |

---

## Interactive Features

- 🖱 **Drag** nodes — reorganise the network layout
- 🔍 **Scroll/pinch** — zoom in/out with smooth transitions
- 🔎 **Search** — real-time concept filtering
- 🎨 **Legend** — click domains to isolate clusters
- ★ **Hub highlight** — highlight top-5 highest-degree nodes
- ≡ **Stats panel** — network-level metrics (density, clustering, modularity, diameter, assortativity, hubs)
- 📌 **Node detail** — click any node for per-node metrics (degree, weighted degree, local clustering coefficient, ego-network density, betweenness approximation)
- ⌨ **Keyboard** — Tab to navigate, Enter/Space to select, Escape to close panels

---

## Network Statistics (per map)

Each map computes and displays:

| Metric | Description |
|--------|-------------|
| **N (nodes)** | Total concepts in the network |
| **E (edges)** | Total weighted connections |
| **Density** | E / (N×(N−1)/2) — how densely connected |
| **Avg Degree** | Mean connections per concept |
| **Max Degree** | Highest-degree hub concept |
| **Avg Clustering Coefficient** | Mean local transitivity |
| **Modularity Q** | Cluster separation quality |
| **Diameter** | Longest shortest path (BFS estimate) |
| **Assortativity r** | Degree correlation (Pearson) |
| **Top Hubs** | 5 highest-degree concepts |

---

## File Structure

```
mlkn-lab/
├── index.html                        # Homepage (essay + network grid)
├── .nojekyll                         # Disables Jekyll processing
├── _config.yml                       # baseurl: "" for relative paths
├── LICENSE                           # MIT License
├── README.md                         # This file
│
├── assets/
│   ├── style.css                     # Shared responsive CSS
│   ├── mlkn.js                       # Shared JS: nav, D3 graph engine
│   └── graph-stats.js               # Network statistics module
│
├── networks/
│   ├── mathematical-science.html
│   ├── computer-science.html
│   ├── logic.html
│   ├── systems-science.html
│   ├── neuroscience.html
│   ├── environmental-science.html
│   ├── medicine.html
│   ├── public-health.html
│   ├── bioethics.html
│   ├── anthropology.html
│   ├── law.html
│   ├── education-science.html
│   ├── economics.html
│   ├── psychology.html
│   ├── sociology.html
│   ├── digital-geopolitics.html
│   ├── philosophy.html
│   ├── language-science.html
│   ├── social-epistemology.html
│   ├── history-of-science.html
│   ├── art-and-design.html
│   ├── engineering.html
│   ├── design.html
│   ├── urban-planning.html
│   ├── architecture.html
│   ├── interdisciplinary.html        # 3-layer interdisciplinary hub
│   │
│   ├── mathematical-science-data.js            # Node/link data (self-contained)
│   ├── computer-science-data.js
│   ├── logic-data.js
│   ├── systems-science-data.js
│   ├── neuroscience-data.js
│   ├── environmental-science-data.js
│   ├── medicine-data.js
│   ├── public-health-data.js
│   ├── bioethics-data.js
│   ├── anthropology-data.js
│   ├── law-data.js
│   ├── education-science-data.js
│   ├── economics-data.js
│   ├── psychology-data.js
│   ├── sociology-data.js
│   ├── digital-geopolitics-data.js
│   ├── philosophy-data.js
│   ├── language-science-data.js
│   ├── social-epistemology-data.js
│   ├── history-of-science-data.js
│   ├── art-and-design-data.js
│   ├── engineering-data.js
│   ├── design-data.js
│   ├── urban-planning-data.js
│   ├── architecture-data.js
│   └── interdisciplinary-data.js     # Full multi-discipline dataset
│
└── .github/
    └── workflows/
        └── deploy.yml                # GitHub Actions: deploy on push
```

---

## Deployment Guide — Step by Step

### Prerequisites
- A GitHub account
- Git installed on your computer ([git-scm.com](https://git-scm.com/))

### Step 1 — Create a GitHub repository

1. Log in to [github.com](https://github.com)
2. Click **New repository** (top-right "+" button → "New repository")
3. Repository name: **`mlkn-lab`** (exactly this, lowercase)
4. Set to **Public** (required for free GitHub Pages)
5. **Do NOT** initialize with README, .gitignore, or license (you already have files)
6. Click **Create repository**

### Step 2 — Upload the files

**Option A — GitHub web interface (simplest):**
1. On the repository page, click **"uploading an existing file"**
2. Extract the ZIP file on your computer
3. Drag ALL files and folders into the upload area
   - ⚠️ You must also upload the hidden files: `.nojekyll` and `.github/workflows/deploy.yml`
   - On Mac/Linux: in Finder/Files, press Cmd+Shift+. to show hidden files
   - On Windows: in File Explorer, View → Hidden items (check the box)
4. At the bottom, type a commit message: `Initial MLKN.lab deployment`
5. Click **Commit changes**

**Option B — Git command line (recommended):**
```bash
# Extract the zip to a folder called mlkn-lab
cd mlkn-lab

# Initialize git
git init

# Add all files (including hidden .nojekyll)
git add -A

# First commit
git commit -m "Initial MLKN.lab deployment"

# Link to your GitHub repository (replace FrancoisPapin with your username)
git remote add origin https://github.com/FrancoisPapin/mlkn-lab.git

# Push to GitHub
git push -u origin main
```

### Step 3 — Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** (top menu, gear icon)
3. In the left sidebar, click **Pages**
4. Under "Build and deployment":
   - Source: **GitHub Actions** ← select this
5. Click **Save**

### Step 4 — Trigger the deployment

The deployment runs automatically when you push. To check status:
1. Click the **Actions** tab in your repository
2. You should see a workflow called "Deploy MLKN.lab to GitHub Pages" running
3. Wait 1–3 minutes for it to complete (green checkmark ✓)
4. Click the workflow run to see the deployment URL

### Step 5 — Access your live site

Your site will be available at:
```
https://[your-github-username].github.io/mlkn-lab/
```
Example: `https://francoispapin.github.io/mlkn-lab/`

---

## Troubleshooting

### The graphs don't appear / blank pages
- Check the browser console (F12 → Console) for errors
- Verify the D3 CDN loaded (you need internet access)
- Confirm all data files are present in `networks/`

### GitHub Pages shows 404
- Wait 5 minutes after enabling Pages (propagation delay)
- Verify **Source** is set to **GitHub Actions** in Settings → Pages
- Check Actions tab for failed workflow runs

### Graphs look different on mobile
- The layout adapts responsively; some panels (stats) hide on small screens
- Pinch to zoom, tap nodes to open detail panel

### The .nojekyll file is missing / Jekyll errors
- On the GitHub web interface, create a new file named `.nojekyll` with no content
- Or via command line: `touch .nojekyll && git add .nojekyll && git commit -m "Add .nojekyll" && git push`

### Layout broken / CSS not loading
- All paths in this project are **document-relative** (no leading `/`)
- If you rename the repository, no changes needed — paths auto-adapt

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Graph engine | D3.js v7 (force-directed simulation) |
| Statistics | Custom vanilla JS (graph-stats.js) |
| Styling | CSS custom properties, CSS Grid, Flexbox |
| Fonts | Google Fonts (Outfit + Space Mono) |
| Hosting | GitHub Pages + GitHub Actions |
| Data | Self-contained JS files (no API calls, no CORS issues) |

---

## Security

- All external CDN scripts use SRI (Subresource Integrity) hashes
- All external links use `rel="noopener noreferrer"`
- No cookies, no tracking, no data collection
- Content Security Policy meta tags on all pages
- Zero `eval()` calls — strict mode throughout

---

## Browser Compatibility

Tested and working on:
- Chrome 90+ / Edge 90+ / Opera 75+
- Firefox 90+
- Safari 14+ (macOS and iOS)
- Samsung Internet 14+
- All major operating systems: macOS, Windows, Linux, Android, iOS

---

## License

**MIT License** — © François Papin, April 2026

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software.

---

## Selected References

- Klein, J. T. (1990). *Interdisciplinarity: History, theory, and practice.* Wayne State University Press.
- Leydesdorff, L., & Rafols, I. (2011). Indicators of the interdisciplinarity of journals. *Journal of Informetrics, 5*(1), 87–100.
- Repko, A. F., & Szostak, R. (2021). *Interdisciplinary research: Process and theory* (4th ed.). SAGE.
- Van Noorden, R. (2015). Interdisciplinary research by the numbers. *Nature, 525*, 306–307.
- Watts, D. J., & Strogatz, S. H. (1998). Collective dynamics of 'small-world' networks. *Nature, 393*, 440–442.
