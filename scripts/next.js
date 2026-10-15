const path = require('node:path');
const { spawnSync } = require('node:child_process');

const env = { ...process.env };
// Windows Application Control may block Next.js's native SWC addon. Use its
// version-matched WebAssembly fallback on Windows; other platforms stay native.
if (process.platform === 'win32' && !env.NEXT_TEST_WASM_DIR) {
  env.NEXT_TEST_WASM_DIR = path.resolve('node_modules', '@next', 'swc-wasm-nodejs');
}

const nextCli = require.resolve('next/dist/bin/next');
const result = spawnSync(process.execPath, [nextCli, ...process.argv.slice(2)], {
  env,
  stdio: 'inherit',
});

if (result.error) throw result.error;
process.exit(result.status ?? 1);
