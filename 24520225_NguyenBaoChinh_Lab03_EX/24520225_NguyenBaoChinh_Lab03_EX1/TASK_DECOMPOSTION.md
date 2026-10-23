# TASK_DECOMPOSITION.md

## Exercise 1 — Semantic Engineer & Pro-Gamer Profile Card

### Goal
Build a React 19 profile card with reusable `DeveloperCard` and `SkillBadge` components, semantic HTML, scoped CSS Modules, and responsive behavior at a 375px viewport.

### Commit plan

The exercise is intentionally split into exactly two atomic commits. Do not create an extra commit for setup or documentation if the rubric requires exactly these two commits.

#### Commit 1 — Functional components
**Required commit message**

```text
feat(ex1): implement semantic DeveloperCard and SkillBadge
```

**Scope**
- `src/components/DeveloperCard.jsx`
  - Implement `DeveloperCard` as a functional component.
  - Use ES6 default parameter values for profile data.
  - Use semantic elements such as `<article>`, `<header>`, `<hgroup>`, `<section>`, `<dl>`, `<dt>`, `<dd>`, `<ul>`, and `<li>`.
  - Do not use any `<div>` element in this file.
  - Connect the card to its heading using `aria-labelledby`.
  - Render metrics using `Object.entries()` and keyed `<Fragment>` elements.
  - Render skills with stable keys such as `skill.id`.
  - Use an HTTPS avatar URL and explicit image `width` and `height`; provide meaningful `alt` text.
- `src/components/SkillBadge.jsx`
  - Implement a reusable skill badge component.
  - Accept skill name and tier through props with sensible defaults.
- `src/App.jsx`
  - Render `DeveloperCard` so the functional implementation can be verified.
- `src/main.jsx`
  - Keep the Vite React entry point working.

**Verification before committing**
1. `npm run build` succeeds.
2. The browser displays the profile card.
3. `grep -n '<div' src/components/DeveloperCard.jsx` returns no matches.
4. `grep -n 'http://' src/components/DeveloperCard.jsx` returns no matches.
5. Confirm no missing React keys or import errors in the browser console.

**Commit command**

```bash
git add src/App.jsx src/main.jsx src/components/DeveloperCard.jsx src/components/SkillBadge.jsx
git commit -m "feat(ex1): implement semantic DeveloperCard and SkillBadge"
```

If `DeveloperCard.module.css` is required for the first commit to compile, stage that file in Commit 1 as well. Avoid committing a broken intermediate state.

#### Commit 2 — Responsive CSS Module
**Required commit message**

```text
style(ex1): add responsive 375px CSS module
```

**Scope**
- `src/components/DeveloperCard.module.css`
  - Add scoped styles for the card, header, avatar, metrics, skills, and footer.
  - Use CSS custom properties for reusable colors and values.
  - Add a responsive breakpoint suitable for a 375px viewport.
  - Prevent horizontal overflow and allow long names/metric labels to wrap.
- `src/index.css`
  - Add global page typography, background, box sizing, and layout styles.
  - Style `SkillBadge` if its styles are not scoped in a separate module.
- `src/App.jsx`
  - Keep only the page-level layout and `DeveloperCard` composition; avoid unnecessary wrapper elements inside `DeveloperCard`.

**Verification before committing**
1. `npm run build` succeeds.
2. Check the page at a 375px viewport in Chrome DevTools.
3. Confirm there is no horizontal scrolling.
4. Confirm text, avatar, metrics, and skill badges remain readable.
5. Confirm styles are loaded from the intended CSS files.

**Commit command**

```bash
git add src/index.css src/components/DeveloperCard.module.css
git commit -m "style(ex1): add responsive 375px CSS module"
```

If `App.jsx` changed as part of the final styling pass, include it only when those changes genuinely belong to the styling commit.

### Final Git audit

```bash
git log --oneline -2
git status
```

The two newest commits should use the exact messages above. A clean working tree is preferred before submission.

### Evidence checklist
- [ ] Project structure visible in VS Code Explorer.
- [ ] Profile card visible in the browser.
- [ ] Chrome DevTools viewport set to 375px with no horizontal overflow.
- [ ] Semantic/HTTPS audit commands show no matches.
- [ ] `npm run build` succeeds.
- [ ] `git log --oneline -2` shows both required commits.
