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
  const desc = `AI-generated ${tone?.en?.toLowerCase() || ''} ${topic?.en?.toLowerCase() || 'tech'} news from ${year?.en || 'the future'}. See what HN headlines might look like!`;
  
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><meta name="description" content="${desc}"><link rel="canonical" href="${url}"><meta property="og:title" content="${title}"><meta property="og:description" content="${desc}"><script async src="https://www.googletagmanager.com/gtag/js?id=G-P4ZLGKH1E1"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-P4ZLGKH1E1');</script><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Verdana,Geneva,sans-serif;background:#f6f6ef;color:#000;padding:24px;max-width:720px;margin:0 auto;line-height:1.6}h1{color:#ff6600;font-size:1.5rem;margin-bottom:1rem}p{margin-bottom:1rem;color:#666}.cta{background:#ff6600;color:#fff;padding:12px 24px;text-decoration:none;display:inline-block;margin:20px 0;font-weight:700}.cta:hover{background:#e55b00}footer{margin-top:2rem;font-size:.8rem;color:#999}</style></head><body><h1>📰 ${h1}</h1><p>What will ${topic?.en?.toLowerCase() || 'tech'} headlines look like in ${year?.en || 'the future'}? Our AI generates ${tone?.en?.toLowerCase() || 'realistic'} Hacker News posts from the future.</p><a href="${TOOL_URL}?utm_source=seo" class="cta">Generate Future News →</a><footer>© 2024 DenseMatrix</footer></body></html>`;
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
