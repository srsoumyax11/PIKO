import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Because we're executing this with bun, we can import ts directly
import { SEO_COUNTRIES, generateSlug, getPageTitle, getPageDescription, getPageKeywords } from '../src/lib/seoData.ts';
import { APP_DOMAIN } from '../src/lib/constants.ts';

const PUBLIC_DIR = path.join(process.cwd(), 'public');
const DIST_DIR = path.join(process.cwd(), 'dist');

async function generateSitemap() {
  console.log('Generating sitemap.xml...');
  
  const urls: string[] = [];
  
  // Add home page
  urls.push(`  <url>
    <loc>${APP_DOMAIN}/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>`);

  // Add all dynamic SEO routes
  for (const country of SEO_COUNTRIES) {
    for (const doc of country.documents) {
      const slug = generateSlug(doc.id);
      urls.push(`  <url>
    <loc>${APP_DOMAIN}/${slug}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`);
    }
  }

  const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

  if (!fs.existsSync(PUBLIC_DIR)) {
    fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  }
  
  fs.writeFileSync(path.join(PUBLIC_DIR, 'sitemap.xml'), sitemapContent);
  console.log(`✅ sitemap.xml generated with ${urls.length} URLs!`);
  
  const robotsContent = `User-agent: *
Allow: /

Sitemap: ${APP_DOMAIN}/sitemap.xml`;
  fs.writeFileSync(path.join(PUBLIC_DIR, 'robots.txt'), robotsContent);
  console.log(`✅ robots.txt generated!`);
}

async function prerender() {
  console.log('Pre-rendering SEO pages for crawlers...');
  
  const templatePath = path.join(DIST_DIR, 'index.html');
  if (!fs.existsSync(templatePath)) {
    console.error('❌ dist/index.html not found! Run bun run build first.');
    return;
  }
  
  const template = fs.readFileSync(templatePath, 'utf-8');
  
  let count = 0;
  for (const country of SEO_COUNTRIES) {
    for (const doc of country.documents) {
      const slug = generateSlug(doc.id);
      const title = getPageTitle(country, doc);
      const desc = getPageDescription(country, doc);
      const kw = getPageKeywords(country, doc);
      const url = `${APP_DOMAIN}/${slug}`;
      const img = `${APP_DOMAIN}/social-banner.png`;
      
      // We do a simple string replacement on the <head> tags
      let html = template
        .replace(/<title>(.*?)<\/title>/, `<title>${title}</title>`)
        .replace('</head>', `
    <link rel="canonical" href="${url}" />
    <meta name="title" content="${title}" />
    <meta name="description" content="${desc}" />
    <meta name="keywords" content="${kw}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${desc}" />
    <meta property="og:image" content="${img}" />
    <meta property="twitter:title" content="${title}" />
    <meta property="twitter:description" content="${desc}" />
    <meta property="twitter:image" content="${img}" />
  </head>`);

      const routeDir = path.join(DIST_DIR, slug);
      if (!fs.existsSync(routeDir)) {
        fs.mkdirSync(routeDir, { recursive: true });
      }
      
      fs.writeFileSync(path.join(routeDir, 'index.html'), html);
      count++;
    }
  }
  
  console.log(`✅ Successfully pre-rendered static HTML files for ${count} SEO routes!`);
}

async function run() {
  await generateSitemap();
  // If we are running this post-build, the dist directory will exist.
  if (fs.existsSync(DIST_DIR)) {
    await prerender();
  }
}

run();
