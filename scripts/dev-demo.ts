import { spawn, type ChildProcess } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { once } from 'node:events';
import { rmSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import EmbeddedPostgres from 'embedded-postgres';
import S3rver from 's3rver';

const APP_PORT = 3000;
const APP_HOST = 'localhost';

async function freePort() {
  const server = createServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('빈 로컬 포트를 찾지 못했습니다.');
  const port = address.port;
  await new Promise<void>((resolve) => server.close(() => resolve()));
  return port;
}

async function runNpm(args: string[], env: NodeJS.ProcessEnv) {
  const child = spawn('npm', args, { env, stdio: 'inherit' });
  const [code] = await once(child, 'exit');
  if (code !== 0) throw new Error(`npm ${args.join(' ')} 실행에 실패했습니다.`);
}

async function createCertificate(keyPath: string, certificatePath: string, env: NodeJS.ProcessEnv) {
  const child = spawn('openssl', [
    'req', '-x509', '-newkey', 'rsa:2048', '-nodes',
    '-keyout', keyPath, '-out', certificatePath, '-days', '1', '-subj', '/CN=localhost',
    '-addext', 'subjectAltName=DNS:localhost,IP:127.0.0.1',
  ], { env, stdio: 'ignore' });
  const [code] = await once(child, 'exit');
  if (code !== 0) throw new Error('로컬 HTTPS 인증서 생성에 실패했습니다. OpenSSL 설치를 확인하세요.');
}

async function main() {
  const runtimeDir = await mkdtemp(join(tmpdir(), 'okfire-demo-'));
  const [databasePort, storagePort] = await Promise.all([freePort(), freePort()]);
  const databasePassword = randomBytes(24).toString('hex');
  const adminPassword = `Local!${randomBytes(10).toString('base64url')}`;
  const origin = `https://${APP_HOST}:${APP_PORT}`;
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    DATABASE_URL: `postgresql://postgres:${databasePassword}@127.0.0.1:${databasePort}/okfire`,
    DIRECT_URL: `postgresql://postgres:${databasePassword}@127.0.0.1:${databasePort}/okfire`,
    APP_ORIGIN: origin,
    AUTH_SECRET: randomBytes(32).toString('hex'),
    SEED_ADMIN_NAME: '로컬 테스트 관리자',
    SEED_ADMIN_EMAIL: 'admin@okfire.local',
    SEED_ADMIN_PASSWORD: adminPassword,
    PRIVACY_RETENTION_TEXT: '로컬 기능 테스트가 끝날 때까지 (운영정책 아님)',
    PRIVACY_CONTACT_TEXT: '010-7124-8119',
    PRIVACY_POLICY_VERSION: 'local-demo-only',
    STORAGE_ENDPOINT: `http://localhost:${storagePort}`,
    STORAGE_REGION: 'us-east-1',
    STORAGE_BUCKET: 'okfire-local-demo',
    STORAGE_ACCESS_KEY_ID: 'LOCAL_DEMO',
    STORAGE_SECRET_ACCESS_KEY: randomBytes(24).toString('hex'),
    VERCEL: '0',
  };
  const postgres = new EmbeddedPostgres({
    databaseDir: join(runtimeDir, 'postgres'),
    user: 'postgres',
    password: databasePassword,
    port: databasePort,
    persistent: false,
    authMethod: 'scram-sha-256',
    postgresFlags: ['-h', '127.0.0.1', '-k', runtimeDir, '-c', 'timezone=Asia/Seoul'],
    onLog: () => {},
    onError: () => {},
  });
  const objectStorage = new S3rver({
    address: 'localhost',
    port: storagePort,
    silent: true,
    directory: join(runtimeDir, 'objects'),
    resetOnClose: true,
    configureBuckets: [{
      name: env.STORAGE_BUCKET!,
      configs: [`<CORSConfiguration><CORSRule><AllowedOrigin>${origin}</AllowedOrigin><AllowedMethod>PUT</AllowedMethod><AllowedMethod>GET</AllowedMethod><AllowedMethod>HEAD</AllowedMethod><AllowedHeader>*</AllowedHeader></CORSRule></CORSConfiguration>`],
    }],
  });
  let app: ChildProcess | undefined;
  let postgresStarted = false;
  let storageStarted = false;
  let stopping = false;

  const stopApp = () => {
    stopping = true;
    if (app?.pid && app.exitCode === null) {
      try { process.kill(-app.pid, 'SIGTERM'); } catch { app.kill('SIGTERM'); }
    }
  };
  const removeSensitiveFiles = () => {
    try { rmSync(runtimeDir, { recursive: true, force: true }); } catch {}
  };
  const handleSignal = () => { removeSensitiveFiles(); stopApp(); };
  // embedded-postgres also handles signals, so remove temporary customer data synchronously first.
  process.prependOnceListener('SIGINT', handleSignal);
  process.prependOnceListener('SIGTERM', handleSignal);
  process.once('exit', removeSensitiveFiles);

  try {
    await objectStorage.run();
    storageStarted = true;
    await postgres.initialise();
    await postgres.start();
    postgresStarted = true;
    await postgres.createDatabase('okfire');
    await runNpm(['run', 'db:deploy'], env);
    await runNpm(['run', 'db:seed'], env);
    const certificateKey = join(runtimeDir, 'localhost-key.pem');
    const certificate = join(runtimeDir, 'localhost.pem');
    await createCertificate(certificateKey, certificate, env);

    console.log('\nOK소방 로컬 체험 환경이 준비되었습니다.');
    console.log(`상담 및 사진 업로드: ${origin}/contact`);
    console.log(`관리자 로그인: ${origin}/admin/login`);
    console.log(`관리자 이메일: ${env.SEED_ADMIN_EMAIL}`);
    console.log(`관리자 비밀번호: ${adminPassword}`);
    console.log('브라우저의 로컬 개발 인증서 경고를 한 번 허용해주세요.');
    console.log('종료하려면 Ctrl+C를 누르세요. 접수·사진·비밀번호는 종료 후 삭제됩니다.\n');

    app = spawn(process.execPath, [
      'node_modules/next/dist/bin/next', 'dev', '--experimental-https',
      '--experimental-https-key', certificateKey,
      '--experimental-https-cert', certificate,
      '--hostname', APP_HOST, '--port', String(APP_PORT),
    ], {
      env,
      stdio: 'inherit',
      detached: true,
    });
    const [code] = await once(app, 'exit');
    if (!stopping && code !== 0) throw new Error('Next.js 개발 서버가 비정상 종료되었습니다. 3000번 포트가 사용 중인지 확인하세요.');
  } finally {
    if (app?.pid && app.exitCode === null) {
      try { process.kill(-app.pid, 'SIGTERM'); } catch { app.kill('SIGTERM'); }
    }
    if (storageStarted) await objectStorage.close();
    if (postgresStarted) await postgres.stop();
    await rm(runtimeDir, { recursive: true, force: true });
    console.log('로컬 체험 데이터와 임시 비밀값을 삭제했습니다.');
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : '로컬 체험 환경 실행에 실패했습니다.');
  process.exitCode = 1;
});
