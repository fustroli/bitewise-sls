// Bundles each Lambda into dist/<name>.zip for upload in the Lambda console (handler:
// index.handler). Same esbuild settings as CDK's NodejsFunction, so both builds match.
import { rmSync, writeFileSync } from 'node:fs';
import { build } from 'esbuild';

// Zip name → entry file under src/
const FUNCTIONS: Record<string, string> = {
  'custom-message': 'triggers/custom-message.ts',
  'post-confirmation': 'triggers/post-confirmation.ts',
  'pre-sign-up': 'triggers/pre-sign-up.ts',
  ingredients: 'handlers/ingredients.ts',
  meals: 'handlers/meals.ts',
  'meal-plans': 'handlers/meal-plans.ts',
  users: 'handlers/users.ts',
  'avatar-processor': 'triggers/avatar-processor.ts',
};

// Native packages esbuild can't bundle: shipped in the zip's node_modules, installed for the
// Lambda's platform (Linux arm64, glibc), not this machine's.
const NATIVE: Record<string, string[]> = { 'avatar-processor': ['sharp'] };
const pkg = await Bun.file('package.json').json();

rmSync('dist', { recursive: true, force: true });

for (const [name, entry] of Object.entries(FUNCTIONS)) {
  await build({
    entryPoints: [`src/${entry}`],
    outfile: `dist/${name}/index.mjs`,
    bundle: true,
    platform: 'node',
    target: 'node22',
    format: 'esm',
    // The Node 22 runtime ships the AWS SDK v3 clients; helpers like s3-presigned-post get bundled
    external: ['@aws-sdk/client-*', '@aws-sdk/lib-dynamodb', ...(NATIVE[name] ?? [])],
    // Lets CommonJS dependencies call require() inside the ESM bundle
    banner: { js: "import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);" },
  });
  const native = NATIVE[name];
  if (native) {
    const dependencies = Object.fromEntries(native.map((dep) => [dep, pkg.dependencies[dep]]));
    writeFileSync(`dist/${name}/package.json`, JSON.stringify({ type: 'module', dependencies }));
    run(['npm', 'install', '--omit=dev', '--no-package-lock', '--os=linux', '--cpu=arm64', '--libc=glibc'], `dist/${name}`);
    // sharp's WebAssembly fallback declares no cpu, so npm installs it anyway; 9 MB never loaded
    for (const dir of ['@img/sharp-wasm32', '@emnapi']) rmSync(`dist/${name}/node_modules/${dir}`, { recursive: true, force: true });
  }
  const files = native ? ['index.mjs', 'node_modules'] : ['index.mjs'];
  run(['zip', '-rq', `../${name}.zip`, ...files], `dist/${name}`);
  console.log(`dist/${name}.zip`);
}

function run(cmd: string[], cwd: string): void {
  const result = Bun.spawnSync(cmd, { cwd });
  if (result.exitCode !== 0) throw new Error(`${cmd.join(' ')} failed in ${cwd}: ${result.stderr}`);
}
