import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const root = process.cwd();
const allowedMeasurementId = 'G-QV0HJJW6BQ';
const sourceRoots = ['src', 'scripts'];
const failures = [];

function walk(directory) {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

function fail(message) {
  failures.push(message);
}

const files = sourceRoots.flatMap((directory) => walk(join(root, directory)));
const textFiles = files.filter((file) => /\.(astro|css|d\.ts|js|mjs|ts)$/.test(file));
const corpus = textFiles.map((file) => ({
  file,
  relativePath: relative(root, file).split(sep).join('/'),
  text: readFileSync(file, 'utf8')
}));

const measurementIds = new Set();
for (const { text } of corpus) {
  for (const match of text.matchAll(/\bG-[A-Z0-9]+\b/g)) measurementIds.add(match[0]);
}

if (measurementIds.size !== 1 || !measurementIds.has(allowedMeasurementId)) {
  fail(`expected only ${allowedMeasurementId}, found ${[...measurementIds].join(', ') || 'none'}`);
}

const analytics = corpus.find(({ relativePath }) => relativePath === 'src/components/AnalyticsConsent.astro')?.text ?? '';
const layout = corpus.find(({ relativePath }) => relativePath === 'src/components/BaseLayout.astro')?.text ?? '';
const privacy = corpus.find(({ relativePath }) => relativePath === 'src/pages/privacy.astro')?.text ?? '';

if (!analytics.includes("productionHost = 'bloxtier.com'")) fail('production host guard for bloxtier.com is missing');
if (analytics.includes('googletagmanager.com/gtag/js') && !analytics.includes('document.createElement')) {
  fail('GA tag loading is not controlled by the consent script');
}
if (!analytics.includes('window.dataLayer.push(arguments)')) fail('analytics queue must use dataLayer.push(arguments)');
if (analytics.includes('dataLayer.push(args)') || analytics.includes('dataLayer.push(_args)')) {
  fail('analytics queue must not use dataLayer.push(args)');
}
if (!layout.includes('gtag(\'consent\', \'default\'')) fail('Consent Mode default is missing from BaseLayout head');

for (const key of ['analytics_storage', 'ad_storage', 'ad_user_data', 'ad_personalization']) {
  if (!layout.includes(key) || !analytics.includes(key)) fail(`Consent Mode key missing from default or update: ${key}`);
}

if (!analytics.includes('allow_google_signals: false')) fail('Google signals must remain disabled');
if (!analytics.includes('allow_ad_personalization_signals: false')) fail('ad personalization signals must remain disabled');
if (!analytics.includes('localStorage.setItem(consentKey')) fail('minimal localStorage consent persistence is missing');
if (!analytics.includes('[data-privacy-choices]')) fail('footer privacy choices reopen control is not wired');
if (!analytics.includes('updateConsent(granted)')) fail('acceptance must grant analytics_storage');
if (!analytics.includes("ad_storage: 'denied'")) fail('ad storage must remain denied');

if (/Google-certified advertising CMP[^.]*configured/i.test(privacy)) {
  fail('privacy text appears to claim certified CMP configuration');
}
if (!/does not provide a Google-certified advertising CMP/i.test(privacy)) {
  fail('privacy text must truthfully state certified advertising CMP is not configured');
}

console.log(JSON.stringify({
  checkedFiles: corpus.length,
  measurementIds: [...measurementIds],
  failures
}, null, 2));

if (failures.length) process.exitCode = 1;
