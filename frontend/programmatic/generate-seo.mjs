#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const config = JSON.parse(readFileSync(join(__dirname, 'dimensions.json'), 'utf-8'));
const outputDir = join(__dirname, '../public/p');
const TOOL_URL = config.tool_url;

if (existsSync(outputDir)) rmSync(outputDir, { recursive: true });
mkdirSync(outputDir, { recursive: true });

function generatePages() {
  const pages = [], seen = new Set(), d = config.dimensions;
  const add = (slug, data) => { if (!seen.has(slug)) { seen.add(slug); pages.push({ slug, ...data }); } };
  
  // topic × year × tone (960)
  for (const top of d.topic.values) {
    for (const yr of d.year.values) {
      for (const t of d.tone.values) {
        add(`${top.id}-${yr.id}-${t.id}`, { topic: top, year: yr, tone: t });
      }
    }
  }
  // topic × year × event (1,200)
  for (const top of d.topic.values) {
    for (const yr of d.year.values) {
      for (const ev of d.event_type.values) {
        add(`${top.id}-${yr.id}-${ev.id}`, { topic: top, year: yr, event: ev });
      }
    }
  }
  // topic × tone × event (1,600)
  for (const top of d.topic.values) {
    for (const t of d.tone.values) {
      for (const ev of d.event_type.values) {
        add(`${top.id}-${t.id}-${ev.id}`, { topic: top, tone: t, event: ev });
      }
    }
  }
  // topic × year × tone × event (9,600)
  for (const top of d.topic.values) {
    for (const yr of d.year.values) {
      for (const t of d.tone.values) {
        for (const ev of d.event_type.values) {
          add(`${top.id}-${yr.id}-${t.id}-${ev.id}`, { topic: top, year: yr, tone: t, event: ev });
        }
      }
    }
  }
  return pages;
}

const topicAngles = {
  ai: 'model capability, agent workflows, inference cost, and whether the latest demo survives contact with real users',
  crypto: 'market structure, regulation, custody, and the recurring gap between ideology and actual products',
  space: 'launch economics, satellite networks, deep-space ambitions, and what happens when hardware meets timelines',
  biotech: 'clinical translation, biosecurity, regulation, and the long road from paper result to patient impact',
  quantum: 'error correction, useful algorithms, hardware scaling, and the difference between lab milestones and deployable systems',
  robotics: 'manufacturing cost, autonomy, safety, and whether demos can survive messy real-world environments',
  climate: 'grid integration, industrial incentives, measurement, and whether deployment beats press-release optimism',
  programming: 'developer tooling, language shifts, open-source maintainers, and how software work changes when AI writes more code',
  security: 'attack surfaces, supply-chain exposure, identity, and the uncomfortable fact that every new platform creates new failure modes',
  startup: 'funding cycles, distribution, talent markets, and the difference between a clever product and a durable company'
};

const toneGuides = {
  optimistic: 'look for the upside while keeping enough skepticism to avoid pure hype',
  dystopian: 'follow the failure mode first, then ask what incentives made it likely',
  realistic: 'separate what is technically possible from what can be shipped, priced, and adopted',
  satirical: 'make the headline funny because it is uncomfortably close to something that could happen',
  technical: 'focus on mechanisms, constraints, and second-order engineering consequences',
  clickbait: 'turn a plausible trend into a loud headline, then ground it with useful context',
  academic: 'frame the story like a research abstract that accidentally escaped into Hacker News',
  corporate: 'translate the event into polished announcement language and then read between the lines'
};

const eventGuides = {
  breakthrough: 'ask what benchmark changed, who can reproduce it, and what becomes cheaper afterward',
  acquisition: 'watch whether the buyer wanted talent, users, data, patents, or simply one less competitor',
  ipo: 'look past the first-day price and inspect revenue quality, margins, and dependency risk',
  scandal: 'follow the incentive trail and the control that should have caught it earlier',
  shutdown: 'study what the product proved, what the market rejected, and what another team may reuse later',
  launch: 'compare the launch promise with the narrow first use case that real customers will test',
  regulation: 'track who benefits from compliance costs and which small players get squeezed out',
  layoffs: 'read layoffs as a signal about strategy, capital discipline, and where growth assumptions broke',
  funding: 'ask what milestone the round buys and whether distribution exists beyond investor excitement',
  opensource: 'look for the license, community incentives, and whether the release commoditizes a competitor'
};

function getRelatedPages(page) {
  const d = config.dimensions;
  const topic = page.topic || d.topic.values[0];
  const year = page.year || d.year.values[0];
  const tone = page.tone || d.tone.values[0];
  const event = page.event || d.event_type.values[0];
  const links = [];
  for (const nextYear of d.year.values.filter((item) => item.id !== year.id).slice(0, 2)) {
    links.push({ slug: `${topic.id}-${nextYear.id}-${tone.id}-${event.id}`, label: `${topic.en} ${event.en} in ${nextYear.en}` });
  }
  for (const nextTopic of d.topic.values.filter((item) => item.id !== topic.id).slice(0, 2)) {
    links.push({ slug: `${nextTopic.id}-${year.id}-${tone.id}-${event.id}`, label: `${nextTopic.en} ${year.en} News` });
  }
  for (const nextEvent of d.event_type.values.filter((item) => item.id !== event.id).slice(0, 2)) {
    links.push({ slug: `${topic.id}-${year.id}-${tone.id}-${nextEvent.id}`, label: `${topic.en} ${nextEvent.en}` });
  }
  return links;
}

function generateHTML(p) {
  const { slug, topic, year, tone, event } = p;
  const url = `${TOOL_URL}/p/${slug}/`;
  const parts = [];
  if (tone) parts.push(tone.en);
  if (topic) parts.push(topic.en);
  if (event) parts.push(event.en);
  parts.push('News');
  if (year) parts.push(`from ${year.en}`);
  
  const h1 = parts.join(' ');
  const title = `${h1} | Future Hacker News`;
  const topicLower = topic?.en?.toLowerCase() || 'technology';
  const toneLower = tone?.en?.toLowerCase() || 'realistic';
  const yearText = year?.en || 'the future';
  const eventLower = event?.en?.toLowerCase() || 'trend';
  const topicAngle = topicAngles[topic?.id] || `adoption, economics, regulation, and the gap between ${topicLower} demos and everyday use`;
  const toneGuide = toneGuides[tone?.id] || toneGuides.realistic;
  const eventGuide = eventGuides[event?.id] || 'ask what changed, who benefits, and what breaks next';
  const desc = `Explore ${toneLower} ${topicLower} Hacker News-style headlines for ${yearText}. Includes prediction angles, discussion prompts, and a future-news generator.`;
  const relatedHtml = getRelatedPages(p).map((item) =>
    `<a href="${TOOL_URL}/p/${item.slug}/">${item.label}</a>`
  ).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${title}</title>
  <meta name="description" content="${desc}">
  <link rel="canonical" href="${url}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${desc}">
  <meta property="og:url" content="${url}">
  <meta property="og:type" content="website">
  <script type="application/ld+json">{"@context":"https://schema.org","@type":"WebApplication","name":"${h1}","description":"${desc}","url":"${url}","applicationCategory":"EntertainmentApplication","offers":{"@type":"Offer","price":"0","priceCurrency":"USD"},"publisher":{"@type":"Organization","name":"DenseMatrix","url":"https://densematrix.ai"}}</script>
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-P4ZLGKH1E1"></script>
  <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-P4ZLGKH1E1',{'custom_map':{'dimension1':'tool_name'}});gtag('event','page_view',{'tool_name':'future-hacker-news'});</script>
  <style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Verdana,Geneva,sans-serif;background:#f6f6ef;color:#111;padding:24px;max-width:860px;margin:0 auto;line-height:1.65}h1{color:#ff6600;font-size:1.75rem;line-height:1.25;margin-bottom:1rem}h2{font-size:1.15rem;margin:1.5rem 0 .6rem}.panel{background:#fff8dc;border:1px solid #e6dfb8;padding:18px;margin:18px 0}.headline{background:#fff;border-left:4px solid #ff6600;padding:16px;margin:14px 0}.meta{color:#666;font-size:.9rem}.cta{background:#ff6600;color:#fff;padding:12px 22px;text-decoration:none;display:inline-block;margin:20px 0;font-weight:700}.cta:hover{background:#e55b00}.related a{display:inline-block;margin:4px 8px 4px 0;color:#a84b00;text-decoration:none}.related a:hover{text-decoration:underline}footer{margin-top:2rem;font-size:.8rem;color:#777}</style>
</head>
<body>
  <h1>${h1}</h1>
  <p>Future Hacker News turns trend speculation into plausible HN-style stories. This page focuses on ${topicLower} in ${yearText}, using a ${toneLower} angle and the kind of ${eventLower} that would make founders, engineers, and investors argue in the comments.</p>
  <section class="headline">
    <p class="meta">Example future headline</p>
    <h2>${topic?.en || 'Tech'} ${event?.en || 'Story'} in ${yearText}: What breaks after the demo finally works?</h2>
    <p>The discussion would probably center on ${topicAngle}. A good HN thread would ask for numbers, reproducibility, and the uncomfortable implementation details hidden behind the announcement.</p>
  </section>
  <section class="panel">
    <h2>Prediction angle</h2>
    <p>For a ${toneLower} take, ${toneGuide}. For a ${eventLower}, ${eventGuide}. That combination produces better prompts than generic “future technology” content because it gives the AI a believable conflict.</p>
  </section>
  <section class="panel">
    <h2>Discussion prompts</h2>
    <ul>
      <li>What assumption has to be true for this ${topicLower} story to happen by ${yearText}?</li>
      <li>Who loses power if this ${eventLower} becomes real?</li>
      <li>Which constraint is more likely to dominate: technical limits, pricing, distribution, or regulation?</li>
      <li>What would the top skeptical Hacker News comment say?</li>
    </ul>
  </section>
  <a href="${TOOL_URL}?utm_source=seo&topic=${topic?.id || ''}&year=${year?.id || ''}&tone=${tone?.id || ''}&event=${event?.id || ''}" class="cta">Generate Future News</a>
  <section class="related"><h2>Related future headlines</h2>${relatedHtml}</section>
  <footer>© 2026 <a href="https://densematrix.ai">DenseMatrix</a> | <a href="${TOOL_URL}">Future Hacker News</a></footer>
</body>
</html>`;
}

function generateSitemaps(pages) {
  const today = new Date().toISOString().split('T')[0];
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
  for (const p of pages) xml += `<url><loc>${TOOL_URL}/p/${p.slug}/</loc><lastmod>${today}</lastmod><changefreq>monthly</changefreq><priority>0.6</priority></url>\n`;
  xml += '</urlset>';
  writeFileSync(join(__dirname, '../public/sitemap-programmatic.xml'), xml);
  writeFileSync(join(__dirname, '../public/sitemap-main.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n<url><loc>${TOOL_URL}</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>1.0</priority></url>\n</urlset>`);
  writeFileSync(join(__dirname, '../public/sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n<sitemap><loc>${TOOL_URL}/sitemap-main.xml</loc></sitemap>\n<sitemap><loc>${TOOL_URL}/sitemap-programmatic.xml</loc></sitemap>\n</sitemapindex>`);
}

console.log('🚀 Generating pages...');
const pages = generatePages();
console.log(`📊 Total: ${pages.length}`);
let c = 0;
for (const p of pages) {
  const d = join(outputDir, p.slug);
  mkdirSync(d, { recursive: true });
  writeFileSync(join(d, 'index.html'), generateHTML(p));
  if (++c % 2000 === 0) console.log(`  ${c}/${pages.length}...`);
}
generateSitemaps(pages);
console.log(`✅ Done! ${c} pages`);
