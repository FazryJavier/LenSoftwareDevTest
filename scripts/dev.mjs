// Menjalankan backend atau frontend di mesin host, tanpa Docker dan tanpa menyetel env manual.
// .env di root tidak dibaca karena DATABASE_URL di sana menunjuk host "db" milik Compose.
// Nilai di bawah hanya nilai lokal yang sama dengan db/local/setup.sql, dan variabel yang
// sudah disetel di terminal tetap diutamakan.
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const services = {
  backend: {
    cwd: new URL('../backend/', import.meta.url),
    env: {
      DATABASE_URL: 'postgres://geo:geo_local_only@localhost:5432/geoentity?sslmode=disable',
    },
    command: 'go run ./cmd/server',
  },
  frontend: {
    cwd: new URL('../frontend/', import.meta.url),
    env: {
      VITE_MAP_STYLE_URL: 'https://tiles.openfreemap.org/styles/liberty',
    },
    command: 'npm run dev',
    installCommand: 'npm ci',
    installedPath: 'node_modules',
  },
};

function run(command, cwd, env) {
  return new Promise((resolve, reject) => {
    // npm di Windows adalah file .cmd, yang hanya dapat dijalankan lewat shell.
    const child = spawn(command, { cwd, env, shell: true, stdio: 'inherit' });
    child.on('error', reject);
    child.on('close', (code, signal) => resolve(signal ? 1 : code));
  });
}

async function main() {
  const name = process.argv[2];
  const service = Object.hasOwn(services, name ?? '') ? services[name] : undefined;
  if (!service) {
    console.error('Pemakaian: node scripts/dev.mjs <backend|frontend>');
    return 2;
  }

  // Ctrl+C juga diterima proses anak. Skrip ini menunggunya selesai agar shutdown backend
  // tidak tertimpa prompt terminal.
  process.on('SIGINT', () => {});

  const cwd = fileURLToPath(service.cwd);
  const env = { ...service.env, ...process.env };

  if (service.installCommand && !existsSync(new URL(service.installedPath, service.cwd))) {
    const installCode = await run(service.installCommand, cwd, env);
    if (installCode !== 0) {
      return installCode;
    }
  }
  return run(service.command, cwd, env);
}

process.exitCode = await main();
