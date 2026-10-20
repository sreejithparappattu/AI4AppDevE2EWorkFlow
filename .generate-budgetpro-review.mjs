import { writeFile } from 'node:fs/promises';

const output = 'BudgetPro-Performance-and-Security-Review.pdf';
const pageHeight = 792;
const pageWidth = 612;
const commands = [];

const colors = {
  navy: [0.075, 0.141, 0.227],
  blue: [0.196, 0.42, 0.855],
  slate: [0.29, 0.37, 0.48],
  pale: [0.945, 0.961, 0.988],
  border: [0.87, 0.90, 0.94],
  mediumBg: [1, 0.941, 0.804],
  mediumFg: [0.50, 0.31, 0.02],
  lowBg: [0.91, 0.93, 0.96],
  lowFg: [0.31, 0.38, 0.47],
  greenBg: [0.89, 0.96, 0.92],
  greenFg: [0.12, 0.41, 0.29],
};

function color([r, g, b]) {
  return `${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)}`;
}

function rect(x, top, width, height, fill, stroke = null) {
  const y = pageHeight - top - height;
  let command = `${color(fill)} rg ${x} ${y} ${width} ${height} re f`;
  if (stroke) {
    command += ` ${color(stroke)} RG ${x} ${y} ${width} ${height} re S`;
  }
  commands.push(command);
}

function line(x1, top1, x2, top2, stroke, thickness = 0.7) {
  commands.push(`${color(stroke)} RG ${thickness} w ${x1} ${pageHeight - top1} m ${x2} ${pageHeight - top2} l S`);
}

function text(value, x, top, size = 9, font = 'F1', fill = colors.navy) {
  const safe = String(value).replace(/[^\x20-\x7E]/g, '-').replaceAll('\\', '\\\\').replaceAll('(', '\\(').replaceAll(')', '\\)');
  commands.push(`BT /${font} ${size} Tf ${color(fill)} rg 1 0 0 1 ${x} ${pageHeight - top - size} Tm (${safe}) Tj ET`);
}

function wrap(value, width, size) {
  const maxChars = Math.max(20, Math.floor(width / (size * 0.49)));
  const words = value.split(/\s+/);
  const rows = [];
  let row = '';
  for (const word of words) {
    if (!row) {
      row = word;
    } else if (`${row} ${word}`.length <= maxChars) {
      row += ` ${word}`;
    } else {
      rows.push(row);
      row = word;
    }
  }
  if (row) rows.push(row);
  return rows;
}

function paragraph(value, x, top, width, opts = {}) {
  const size = opts.size ?? 9;
  const leading = opts.leading ?? size * 1.38;
  const font = opts.font ?? 'F1';
  const fill = opts.fill ?? colors.slate;
  const rows = wrap(value, width, size);
  rows.forEach((row, i) => text(row, x, top + i * leading, size, font, fill));
  return top + rows.length * leading;
}

function label(value, x, top) {
  text(value.toUpperCase(), x, top, 8, 'F2', colors.blue);
}

function pageHeader(section, number) {
  commands.length = 0;
  rect(0, 0, pageWidth, 6, colors.blue);
  text('BUDGETPRO  /  ENGINEERING REVIEW', 47, 24, 8, 'F2', colors.blue);
  text(section.toUpperCase(), 47, 43, 8, 'F2', colors.slate);
  line(47, 754, 565, 754, colors.border);
  text('AI-assisted static source review - October 20, 2026', 47, 764, 7.5, 'F1', colors.slate);
  text(`PAGE ${number} OF 4`, 514, 764, 7.5, 'F2', colors.slate);
}

function title(value, top, size = 22) {
  return paragraph(value, 47, top, 518, { size, leading: size * 1.12, font: 'F2', fill: colors.navy });
}

function infoCard(top, heading, body, opts = {}) {
  const x = opts.x ?? 47;
  const width = opts.width ?? 518;
  const bodySize = opts.bodySize ?? 8.35;
  const rows = wrap(body, width - 22, bodySize);
  const height = 26 + rows.length * (bodySize * 1.32) + (opts.extra ?? 0);
  rect(x, top, width, height, opts.bg ?? [1, 1, 1], colors.border);
  if (opts.accent) rect(x, top, 3, height, opts.accent);
  text(heading, x + 11, top + 7, 9.2, 'F2', opts.headingColor ?? colors.navy);
  rows.forEach((row, i) => text(row, x + 11, top + 23 + i * bodySize * 1.32, bodySize, 'F1', colors.slate));
  return top + height;
}

function addPage() {
  const content = commands.join('\n');
  return content;
}

const pages = [];

commands.length = 0;
rect(0, 0, pageWidth, pageHeight, [0.98, 0.985, 0.995]);
rect(0, 0, pageWidth, 8, colors.blue);
rect(0, 8, 19, pageHeight - 8, colors.navy);
text('BUDGETPRO', 61, 72, 10, 'F2', colors.blue);
text('PERFORMANCE  /  SECURITY  /  ENGINEERING', 61, 92, 8, 'F2', colors.slate);
rect(61, 166, 490, 252, colors.navy);
rect(61, 166, 6, 252, colors.blue);
text('PROJECT REVIEW', 87, 197, 8.5, 'F2', [0.65, 0.76, 0.97]);
text('Performance and Security', 87, 244, 23, 'F2', [1, 1, 1]);
text('Review of Using AI', 87, 278, 23, 'F2', [1, 1, 1]);
line(87, 326, 207, 326, [0.36, 0.59, 0.98], 2);
text('React frontend  /  Node.js + Express  /  PostgreSQL', 87, 349, 9, 'F1', [0.85, 0.89, 0.96]);
label('Project', 87, 466);
text('BudgetPro', 87, 482, 14, 'F2', colors.navy);
label('Prepared by', 87, 528);
text('Sreejith P R', 87, 544, 12, 'F2', colors.navy);
label('Date', 87, 590);
text('20 October 2026', 87, 606, 12, 'F2', colors.navy);
line(87, 706, 550, 706, colors.border);
text('AI-ASSISTED SOURCE REVIEW', 87, 722, 7.5, 'F2', colors.slate);
text('2026', 515, 722, 7.5, 'F2', colors.slate);
pages.push(addPage());

pageHeader('Process overview', 2);
let y = title('Process Overview', 64, 23);
y += 6;
y = paragraph('Project: BudgetPro   |   Scope: React frontend, Node.js/Express API, PostgreSQL', 47, y, 518, {
  size: 10,
  font: 'F2',
  fill: colors.slate,
});
y += 10;
rect(47, y, 518, 55, colors.pale, colors.border);
rect(47, y, 4, 55, colors.blue);
text('REVIEW TYPE', 60, y + 7, 7.5, 'F2', colors.blue);
paragraph('AI-assisted, source-based assessment of the checked-in implementation. This is not a penetration test, dependency audit, or measured load test.', 60, y + 19, 491, {
  size: 8.4,
  leading: 11,
  fill: colors.navy,
});
y += 65;
label('01 / Process overview', 47, y);
y += 15;
y = paragraph('The review traced browser input through API validation and database operations, then back to React state and rendering. Separate, bounded prompts were used for each layer so findings could be tied to observable code rather than assumptions.', 47, y, 518, { size: 8.8 });
y += 8;

const promptCards = [
  ['REACT FRONTEND PROMPT', '"Trace authentication and transaction data flow in the React client. Check browser storage, API error handling, dashboard calculations, and whether rendering or data transfer grows with account history. Cite implementation evidence and separate current behavior from scale risk."'],
  ['EXPRESS / SECURITY PROMPT', '"Review routes, session cookies, authentication, validation, SQL parameterization, authorization boundaries, error handling, and HTTP protections. For each concern, state preconditions, impact, confidence, and mitigation; do not claim exploitability without evidence."'],
  ['POSTGRESQL / SCALE PROMPT', '"Inspect schema, constraints, indexes, startup behavior, and query shapes. Estimate how transaction volume and concurrency affect query work, response size, connection demand, and financial precision. Recommend incremental changes supported by observed design."'],
  ['CROSS-LAYER SYNTHESIS PROMPT', '"Combine findings without duplication. Rank security concerns by severity and confidence; classify each as observed control, observed gap, or conditional risk. Rank performance actions by expected bottleneck and identify what requires measurement."'],
];
for (const [heading, body] of promptCards) {
  const next = infoCard(y, heading, body, { bodySize: 7.75 });
  y = next + 5;
}
y += 1;
label('How outputs were analyzed', 47, y);
y += 15;
const steps = [
  ['1 / Establish evidence', 'Read the source files and map claims to routes, components, queries, or schema constraints. Avoid unsupported assumptions.'],
  ['2 / Trace end to end', 'Follow input -> validation -> identity/authorization -> SQL -> response -> React render. Confirm ownership at the API boundary.'],
  ['3 / Assess risk', 'Consider preconditions and impact; rank severity and confidence. Distinguish direct defects from defense-in-depth gaps.'],
  ['4 / Assess scale', 'Compare query work and returned rows with account growth; inspect indexing and connection behavior. Treat forecasts as hypotheses.'],
];
const stepWidth = 253;
steps.forEach(([heading, body], i) => {
  const x = i % 2 === 0 ? 47 : 312;
  const rowTop = y + Math.floor(i / 2) * 58;
  rect(x, rowTop, stepWidth, 52, colors.pale, colors.border);
  text(heading, x + 9, rowTop + 6, 8.1, 'F2', colors.navy);
  paragraph(body, x + 9, rowTop + 18, stepWidth - 18, { size: 7.1, leading: 9, fill: colors.slate });
});
y += 122;
paragraph('Prompts document the review questions used to structure this report; they are not claimed as a verbatim transcript of earlier prompt history. Validate findings against deployment configuration and runtime tests.', 47, y, 518, {
  size: 7.5,
  fill: colors.slate,
});
pages.push(addPage());

pageHeader('Security analysis', 3);
y = title('Security analysis', 64, 22) + 8;
y = paragraph('No critical or high-severity exploitable defect was confirmed in reviewed source. Findings below are code-level hardening gaps or conditional risks to address before handling real financial data at scale.', 47, y, 518, {
  size: 8.7,
});
y += 10;

const findings = [
  ['MEDIUM / HARDENING - No visible auth rate limit', 'Registration and login accept requests without throttling, lockout, or abuse controls. This can enable high-volume password guessing, credential stuffing, and signup abuse; no successful compromise was demonstrated. Evidence: server/index.js:132-169. Mitigate with per-IP and per-account throttling, progressive backoff, and monitoring.'],
  ['MEDIUM / CONDITIONAL - No explicit CSRF/origin check', 'Transaction creation relies on an automatically sent session cookie. SameSite=Lax and allowlisted CORS help, but CORS is not a general CSRF defense; same-site cross-origin contexts (such as a compromised sibling subdomain) may still matter. Evidence: server/index.js:15-20, 49, 202-222. Verify request Origin/Fetch Metadata and add a CSRF token if deployment requires cross-site cookies.'],
  ['LOW / DEFENSE-IN-DEPTH - No visible security headers', 'Production serves static assets without visible Helmet/security-header middleware. CSP, HSTS, clickjacking, and MIME-sniffing policies are not set in this app code; an upstream proxy may already supply some. Evidence: server/index.js:226-229. Configure Helmet/CSP and HSTS at the HTTPS edge; verify deployed responses.'],
  ['LOW / CONDITIONAL - Seven-day JWT cannot be revoked', 'Logout clears the browser cookie, but a copied JWT remains valid until expiry. HttpOnly reduces script access; no token theft was observed. Evidence: server/index.js:60-61, 166-169. Shorten access-token life and add revocation/rotation if prompt invalidation is required.'],
];
for (const [heading, body] of findings) {
  y = infoCard(y, heading, body, { bodySize: 7.7 }) + 6;
}
label('Positive controls observed', 47, y);
y += 15;
const controls = [
  'Passwords hashed with bcrypt (cost 12); raw passwords are not persisted.',
  'JWT held in HttpOnly, SameSite=Lax cookie; Secure enabled in production mode.',
  'Parameterized transaction SQL is scoped to the authenticated user ID.',
  'Request payloads are validated; database constraints reinforce invariants.',
];
controls.forEach((body, i) => {
  const x = i % 2 === 0 ? 47 : 312;
  const rowTop = y + Math.floor(i / 2) * 38;
  rect(x, rowTop, 253, 33, colors.greenBg, colors.border);
  text('IN PLACE', x + 8, rowTop + 5, 7, 'F2', colors.greenFg);
  paragraph(body, x + 67, rowTop + 5, 177, { size: 7.1, leading: 8.6, fill: colors.navy });
});
y += 80;
rect(47, y, 518, 36, [1, 0.973, 0.91], [0.94, 0.86, 0.66]);
paragraph('Scope limit: static source review only. No live database, production headers/proxy, browser CSRF test, penetration test, or independent dependency scan was assessed.', 57, y + 7, 498, {
  size: 7.5,
  leading: 9,
  fill: colors.navy,
});
pages.push(addPage());

pageHeader('Performance considerations', 4);
y = title('Performance considerations', 64, 22) + 8;
y = paragraph('The schema includes a useful per-user/date index. The largest expected scaling pressure is unbounded transaction-history retrieval - not rendering the eight recent rows.', 47, y, 518, {
  size: 8.7,
});
y += 10;

const performance = [
  ['1 / Full history is fetched and summarized in React', 'GET /api/transactions returns every user row; React downloads the full list, then filters the month and calculates totals. Only eight rows are displayed, but all history is transferred and retained. Response bytes, query work, memory, and dashboard latency grow with account history. Evidence: server/index.js:186-198; src/App.jsx:190-210, 235-250, 280-299.'],
  ['2 / Aggregates run after full transfer', 'Monthly totals and expense-category totals are computed in JavaScript after all transactions arrive. Keep aggregate work in SQL and separate it from transaction history. Add date-bounded summary queries and a size-capped recent-transaction endpoint with deterministic cursor pagination; align indexes to the filters and sort.'],
  ['3 / Connection demand scales per API process', 'The pg Pool uses its default per-process limit. Replicas multiply possible connections and can exhaust PostgreSQL capacity before application CPU is saturated. Set max/acquisition/idle limits against the DB budget; monitor wait time and active connections; consider PgBouncer when needed.'],
  ['4 / Schema DDL is coupled to API startup', 'Each API process executes CREATE TABLE / index DDL before serving. This can race across replicas and requires schema privileges on the runtime account. Move changes to versioned, single-run migrations and restrict the runtime DB role to needed data permissions.'],
  ['5 / Amounts cross into binary floating point', 'PostgreSQL stores NUMERIC(12,2), but the API casts to float8 and React sums floating-point values. Rounding drift can appear in larger aggregates. Keep amounts/aggregates as NUMERIC decimal strings or use integer minor units consistently; test rounding behavior.'],
];
for (const [heading, body] of performance) {
  y = infoCard(y, heading, body, { bodySize: 7.6 }) + 5;
}
label('Recommended rollout', 47, y);
y += 14;
const rollout = [
  ['NOW', 'Measure response size and p50/p95 latency with representative small and large histories; add query and pool metrics.'],
  ['BEFORE GROWTH', 'Split SQL summaries from paginated history; cap page size and use stable cursors. Verify plans with EXPLAIN (ANALYZE, BUFFERS) on realistic data.'],
  ['AT HIGHER CONCURRENCY', 'Load-test realistic read/write mixes, tune pool limits to PostgreSQL capacity, and add pooling/caching only when measurements justify it. Re-test user isolation and totals.'],
];
for (const [heading, body] of rollout) {
  text(`${heading}:`, 47, y, 7.4, 'F2', colors.blue);
  y = paragraph(body, 150, y, 415, { size: 7.4, leading: 9.2, fill: colors.slate }) + 4;
}
rect(47, y + 1, 518, 37, colors.pale, colors.border);
paragraph('Conclusion: appropriate for a small application. Prioritize bounded data access and SQL summaries before transaction history grows; use production-like measurements to decide when additional pooling, caching, or indexing is warranted.', 57, y + 8, 498, {
  size: 7.4,
  leading: 9,
  fill: colors.navy,
});
pages.push(addPage());

function pdfEscape(value) {
  return Buffer.from(value, 'binary');
}

const objects = [];
function addObject(content) {
  objects.push(pdfEscape(content));
  return objects.length;
}

const catalogId = addObject('');
const pagesId = addObject('');
const regularFontId = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
const boldFontId = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>');
const infoId = addObject(
  '<< /Title (Performance and Security Review of Using AI) /Author (Sreejith P R) /Subject (BudgetPro project security and performance review) /Creator (AI-assisted source review) /CreationDate (D:20261020) >>',
);
const pageIds = [];

for (const pageContent of pages) {
  const stream = Buffer.from(pageContent, 'ascii');
  const contentId = addObject(`<< /Length ${stream.length} >>\nstream\n${pageContent}\nendstream`);
  const pageId = addObject(
    `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 ${regularFontId} 0 R /F2 ${boldFontId} 0 R >> >> /Contents ${contentId} 0 R >>`,
  );
  pageIds.push(pageId);
}

objects[catalogId - 1] = pdfEscape(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`);
objects[pagesId - 1] = pdfEscape(`<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`);

const chunks = [Buffer.from('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n', 'binary')];
const offsets = [0];
let offset = chunks[0].length;
objects.forEach((object, index) => {
  offsets.push(offset);
  const wrapped = Buffer.concat([
    Buffer.from(`${index + 1} 0 obj\n`, 'ascii'),
    object,
    Buffer.from('\nendobj\n', 'ascii'),
  ]);
  chunks.push(wrapped);
  offset += wrapped.length;
});
const xrefOffset = offset;
const xref = [
  `xref\n0 ${objects.length + 1}`,
  '0000000000 65535 f ',
  ...offsets.slice(1).map((item) => `${String(item).padStart(10, '0')} 00000 n `),
  `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R /Info ${infoId} 0 R >>`,
  `startxref\n${xrefOffset}`,
  '%%EOF',
].join('\n');
chunks.push(Buffer.from(`${xref}\n`, 'ascii'));
await writeFile(output, Buffer.concat(chunks));
