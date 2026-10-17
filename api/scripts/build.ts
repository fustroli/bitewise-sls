// Bundles each Lambda into dist/<name>.zip for upload in the Lambda console (handler:
// index.handler). Same esbuild settings as CDK's NodejsFunction, so both builds match.
import { rmSync } from 'node:fs';
import { build } from 'esbuild';

const FUNCTIONS = ['custom-message', 'post-confirmation', 'pre-sign-up'];

rmSync('dist', { recursive: true, force: true });

for (const name of FUNCTIONS) {
  await build({
    entryPoints: [`src/triggers/${name}.ts`],
    outfile: `dist/${name}/index.mjs`,
    bundle: true,
    platform: 'node',
    target: 'node22',
    format: 'esm',
    // The Node 22 runtime ships AWS SDK v3
    external: ['@aws-sdk/*'],
    // Lets CommonJS dependencies call require() inside the ESM bundle
    banner: { js: "import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);" },
  });
  const zip = Bun.spawnSync(['zip', '-jq', `dist/${name}.zip`, `dist/${name}/index.mjs`]);
  if (zip.exitCode !== 0) throw new Error(`zip failed for ${name}: ${zip.stderr}`);
  console.log(`dist/${name}.zip`);
}
