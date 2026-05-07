# Career-Ops Start Here (Fresh Workflow)

This is the fastest end-to-end flow for your setup.

## 1) One-time setup

Run from project root:

```bash
npm install
npx playwright install chromium
brew install tectonic
npm run doctor
```

## 2) Scan for jobs

Use the scanner (zero LLM token cost):

```bash
npm run scan
```

Notes:
- If you run `career-ops scan` and get command not found, use `npm run scan`.
- New jobs are written to data/pipeline.md.

## 3) Pick links and paste them to Copilot chat

Typical batch size: 5-10 URLs.

Prompt example:

"Evaluate these links for my Embedded/SRE/DevOps profile. Score each role and keep only strong-fit jobs."

What Copilot does:
- Reads each posting
- Scores fit
- Writes evaluation reports to reports/
- Updates data/applications.md tracker
- Marks evaluated/skipped items in data/pipeline.md

## 4) Generate tailored CV + resume PDF per company

For each strong-fit role, ask:

"Generate a tailored LaTeX CV for COMPANY/ROLE. Only adjust summary + skills. Keep one page."

Output convention:
- LaTeX CV: output/companies/{company}/cv-{company}-shubham-shaw.tex
- PDF resume: output/companies/{company}/resume-{company}-shubham-shaw.pdf

Compile a .tex file to PDF:

```bash
node generate-latex.mjs output/companies/<company>/cv-<company>-shubham-shaw.tex
```

## 5) Apply using Playwright in Chrome (human in the loop)

Ask Copilot:

"Open this job link in browser, fill the application form with my info, upload my resume PDF, and stop before final submit."

Important:
- Copilot can automate navigation and form filling with Playwright.
- Final Submit must be your click.

## 6) Verify pipeline health

After each batch:

```bash
npm run verify
```

Optional maintenance:

```bash
npm run normalize
npm run dedup
npm run merge
```

## 7) Minimal repeat loop

1. Scan: `npm run scan`
2. Paste top URLs in chat
3. Let Copilot evaluate + generate reports
4. Generate tailored CV/PDF per target company
5. Use Playwright-assisted apply (stop before submit)
6. Verify: `npm run verify`

---

## Where files live

- Pipeline inbox: data/pipeline.md
- Master tracker: data/applications.md
- Evaluation reports: reports/
- Company CV/PDF outputs: output/companies/
- Base CV template: output/companies/_base/
