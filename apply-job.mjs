#!/usr/bin/env node
/**
 * apply-job.mjs — Headed (visible) Playwright browser for job application form filling
 *
 * Usage:
 *   node apply-job.mjs <job-url> [pdf-path]
 *
 * Examples:
 *   node apply-job.mjs "https://jobs.ashbyhq.com/workos/cff5a16f" "output/companies/workos/resume-workos-shubham-shaw.pdf"
 *   node apply-job.mjs "https://job-boards.greenhouse.io/anthropic/jobs/5186669008"
 *
 * - Opens a REAL visible Chrome window so you watch every fill
 * - Fills common form fields with your profile data
 * - Waits for you to review before submitting anything
 * - NEVER auto-submits. The final click is always yours.
 *
 * One link at a time. Run again with a new URL for each job.
 */

import { chromium } from 'playwright';
import { resolve } from 'path';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Your profile (loaded from config/profile.yml if js-yaml is available) ───
const PROFILE = {
  first_name:  'Ehu Shubham Kishore',
  last_name:   'Shaw',
  full_name:   'Ehu Shubham Kishore Shaw',
  email:       'ehushubham@gmail.com',
  phone:       '+1-774-418-9894',
  location:    'Cambridge, MA',
  linkedin:    'https://linkedin.com/in/shubhamshaw',
  github:      'https://github.com/Extreammouse',
  portfolio:   'https://ehushubhamshaw.netlify.app',
  university:  'Worcester Polytechnic Institute',
  degree:      'Master of Science in Computer Science',
  grad_year:   '2026',
  work_auth:   'F-1 OPT / STEM OPT eligible (no sponsorship needed)',
  salary_min:  '100000',
  salary_target: '115000',
};

// ─── Common field selectors across Greenhouse, Ashby, Lever ───
const FIELD_MAP = [
  { labels: ['first name', 'firstname'],          value: PROFILE.first_name },
  { labels: ['last name', 'lastname', 'surname'],  value: PROFILE.last_name  },
  { labels: ['full name', 'your name', 'name'],    value: PROFILE.full_name  },
  { labels: ['email', 'e-mail'],                   value: PROFILE.email      },
  { labels: ['phone', 'mobile', 'telephone'],      value: PROFILE.phone      },
  { labels: ['linkedin', 'linkedin url'],          value: PROFILE.linkedin   },
  { labels: ['github', 'github url'],              value: PROFILE.github     },
  { labels: ['portfolio', 'website', 'personal url'], value: PROFILE.portfolio },
  { labels: ['city', 'location'],                  value: 'Cambridge'        },
  { labels: ['state'],                             value: 'MA'               },
  { labels: ['country'],                           value: 'United States'    },
  { labels: ['university', 'school', 'college'],   value: PROFILE.university },
  { labels: ['degree', 'education level'],         value: PROFILE.degree     },
  { labels: ['graduation', 'grad year'],           value: PROFILE.grad_year  },
  { labels: ['salary', 'compensation', 'desired salary'], value: PROFILE.salary_target },
  { labels: ['work authorization', 'visa', 'sponsorship'], value: PROFILE.work_auth },
];

async function fillForm(page) {
  let filled = 0;
  for (const mapping of FIELD_MAP) {
    for (const label of mapping.labels) {
      // Try finding by label text
      try {
        const el = page.getByLabel(new RegExp(label, 'i')).first();
        const visible = await el.isVisible().catch(() => false);
        if (visible) {
          const tag = await el.evaluate(n => n.tagName.toLowerCase()).catch(() => '');
          if (tag === 'input' || tag === 'textarea') {
            await el.fill(mapping.value);
            filled++;
            break;
          }
        }
      } catch (_) { /* field not on this page */ }
    }
  }
  return filled;
}

async function uploadResume(page, pdfPath) {
  if (!pdfPath || !existsSync(pdfPath)) return false;
  const abs = resolve(pdfPath);

  // Common resume upload patterns
  const uploadSelectors = [
    'input[type="file"]',
    'input[accept*="pdf"]',
    'input[accept*=".pdf"]',
  ];

  for (const sel of uploadSelectors) {
    const handle = page.locator(sel).first();
    if (await handle.count() > 0) {
      await handle.setInputFiles(abs);
      console.log(`  ✅ Resume uploaded: ${abs}`);
      return true;
    }
  }
  console.log('  ⚠️  No file upload field found — attach resume manually.');
  return false;
}

async function main() {
  const jobUrl = process.argv[2];
  const pdfArg = process.argv[3];

  if (!jobUrl) {
    console.error('\nUsage: node apply-job.mjs <job-url> [pdf-path]\n');
    console.error('Example:');
    console.error('  node apply-job.mjs "https://jobs.ashbyhq.com/workos/cff5a16f" "output/companies/workos/resume-workos-shubham-shaw.pdf"\n');
    process.exit(1);
  }

  // Default PDF — base resume if company-specific one not specified
  const pdfPath = pdfArg || join(__dirname, 'output/companies/_base/resume-shubham-shaw.pdf');

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  career-ops — Headed Browser Application Fill');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  URL:    ${jobUrl}`);
  console.log(`  Resume: ${pdfPath}`);
  console.log('\n  ⚠️  IMPORTANT: This will fill but NEVER submit.');
  console.log('     Review every field before clicking Apply/Submit.\n');

  const browser = await chromium.launch({
    headless: false,          // ← Real visible Chrome window
    channel: 'chromium',      // Use Playwright's Chromium build
    slowMo: 120,              // Slow enough that you can see each action
    args: ['--start-maximized'],
  });

  const context = await browser.newContext({
    viewport: null,           // Use full window size
    acceptDownloads: true,
  });

  const page = await context.newPage();

  console.log('  Opening job page…');
  await page.goto(jobUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  await page.waitForTimeout(2000); // Let JS-rendered forms settle

  console.log('  Filling form fields…');
  const count = await fillForm(page);
  console.log(`  ✅ Filled ${count} field(s).`);

  await uploadResume(page, pdfPath);

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  ✋ STOPPED — review the form in the browser.');
  console.log('  Make edits, add cover note, then click Submit yourself.');
  console.log('  Press Ctrl+C here when done to close the browser.');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Keep browser open until user kills the script
  await new Promise(() => {});
}

main().catch(err => {
  console.error('\nError:', err.message);
  process.exit(1);
});
