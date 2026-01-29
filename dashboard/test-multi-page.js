// Test script for multi-page generator
const { generateMultiPageApp } = require('./src/lib/multi-page-generator.ts');

const testProvider = {
  provider: 'gemini',
  apiKey: process.env.GEMINI_API_KEY || 'test-key',
  model: 'gemini-2.0-flash'
};

const testOptions = {
  appName: 'testapp',
  displayName: 'Test App',
  tagline: 'A test application',
  targetAudience: 'Developers',
  targetPrice: 19,
  coreFeatures: ['Feature 1', 'Feature 2'],
  buildComplexity: 'standard'
};

console.log('Testing multi-page generator...');
console.log('Provider:', testProvider);
console.log('Options:', testOptions);

generateMultiPageApp(testOptions, testProvider, (msg) => {
  console.log('Progress:', msg);
}).then(pages => {
  console.log('✅ Success! Generated', pages.length, 'pages:');
  pages.forEach(p => console.log('  -', p.path, `(${p.type})`));
}).catch(err => {
  console.error('❌ Error:', err.message);
  console.error('Stack:', err.stack);
});
