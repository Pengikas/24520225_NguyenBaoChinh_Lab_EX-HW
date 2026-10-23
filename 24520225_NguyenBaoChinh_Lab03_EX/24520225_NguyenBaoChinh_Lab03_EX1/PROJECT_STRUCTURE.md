# PROJECT_STRUCTURE.md

## Exercise 1 — React 19 Semantic Developer Profile

Recommended structure for the Vite React project. Keep the Vite-generated configuration files unless the instructor specifies otherwise.

```text
24520225_NguyenBaoChinh_EX1/
├── index.html
├── package.json
├── package-lock.json
├── vite.config.js
├── eslint.config.js
├── .gitignore
├── TASK_DECOMPOSITION.md
├── AI_FAILURE_AUDIT.md
├── PROJECT_STRUCTURE.md
├── public/
│   └── (static assets, if needed)
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── index.css
    └── components/
        ├── DeveloperCard.jsx
        ├── DeveloperCard.module.css
        └── SkillBadge.jsx
```

## File responsibilities

| File | Responsibility |
|---|---|
| `index.html` | Vite HTML entry point and root element |
| `src/main.jsx` | Mounts the React application with `createRoot` |
| `src/App.jsx` | Page-level composition and rendering of `DeveloperCard` |
| `src/index.css` | Global reset, typography, page background, and `SkillBadge` base styles |
| `src/components/DeveloperCard.jsx` | Semantic profile card, metrics, and skill list; zero `<div>` tags in this file |
| `src/components/DeveloperCard.module.css` | Component-scoped styles and responsive layout |
| `src/components/SkillBadge.jsx` | Reusable skill name/tier badge |
| `TASK_DECOMPOSITION.md` | Scope, acceptance checks, and exact two-commit plan |
| `AI_FAILURE_AUDIT.md` | Three AI failure modes, reproduction steps, DevTools evidence guidance, and fixes |
| `PROJECT_STRUCTURE.md` | Project tree and responsibilities |

## Commands

Run from the project root:

```bash
npm install
npm run dev
npm run build
```

## Required checks

```bash
grep -n '<div' src/components/DeveloperCard.jsx
grep -n 'http://' src/components/DeveloperCard.jsx
npm run build
git log --oneline -2
git status
```

The first two commands should return no matches. The build should complete successfully. The Git log should show the two commit messages specified in `TASK_DECOMPOSITION.md`.

## Scope clarification

The profile-card exercise and the PUBG telemetry examples in `AI_FAILURE_AUDIT.md` are different contexts. The audit document follows the failure modes shown in the supplied assignment image. If the instructor expects all three bugs to be implemented in the profile-card application itself, adapt the prompts and reproduction steps to actual features in that application rather than claiming the PUBG examples are part of the profile card.
