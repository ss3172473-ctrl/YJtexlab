const net = require("node:net");
const { spawn } = require("node:child_process");

const DEFAULT_PORT = 3000;

function parsePort(args) {
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];

    if (argument === "--port" || argument === "-p") {
      return Number.parseInt(args[index + 1] ?? "", 10);
    }

    if (argument.startsWith("--port=")) {
      return Number.parseInt(argument.slice("--port=".length), 10);
    }

    if (argument.startsWith("-p=")) {
      return Number.parseInt(argument.slice(3), 10);
    }
  }

  const envPort = Number.parseInt(process.env.PORT ?? "", 10);
  return Number.isFinite(envPort) ? envPort : null;
}

function canListen(port) {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once("error", () => {
      resolve(false);
    });

    server.once("listening", () => {
      server.close(() => resolve(true));
    });

    server.listen(port, "127.0.0.1");
  });
}

async function findOpenPort(startPort) {
  let currentPort = startPort;

  while (!(await canListen(currentPort))) {
    currentPort += 1;
  }

  return currentPort;
}

async function main() {
  const forwardedArgs = process.argv.slice(2);
  const explicitPort = parsePort(forwardedArgs);
  const port = explicitPort ?? (await findOpenPort(DEFAULT_PORT));
  const distDir = `.next-dev-${port}`;
  const nextArgs = ["dev", ...forwardedArgs];

  if (explicitPort == null) {
    nextArgs.push("--port", String(port));
  }

  const child = spawn(process.execPath, [require.resolve("next/dist/bin/next"), ...nextArgs], {
    stdio: "inherit",
    env: {
      ...process.env,
      NEXT_DIST_DIR: process.env.NEXT_DIST_DIR || distDir,
      PORT: String(port),
    },
  });

  console.log(`[dev] port=${port} distDir=${process.env.NEXT_DIST_DIR || distDir}`);

  child.on("exit", (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }

    process.exit(code ?? 0);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
