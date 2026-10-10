import { spawn } from "child_process";
import fs from "fs/promises";
import os from "os";
import path from "path";

const ROOT = process.cwd();

export function rembgPythonPath() {
  return path.join(ROOT, "scripts/.venv-rembg/bin/python");
}

export function rembgScriptPath() {
  return path.join(ROOT, "scripts/rembg-white.py");
}

export async function isRembgAvailable() {
  try {
    await fs.access(rembgPythonPath());
    await fs.access(rembgScriptPath());
    return true;
  } catch {
    return false;
  }
}

export async function runRembgWhiteBackground(inputBuffer) {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "sevya-rembg-"));
  const inPath = path.join(tmpDir, "in.png");
  const outPath = path.join(tmpDir, "out.png");

  try {
    await fs.writeFile(inPath, inputBuffer);
    await new Promise((resolve, reject) => {
      const proc = spawn(rembgPythonPath(), [rembgScriptPath(), inPath, outPath], {
        stdio: ["ignore", "pipe", "pipe"],
      });
      let err = "";
      proc.stderr.on("data", (d) => {
        err += d.toString();
      });
      proc.on("close", (code) => {
        if (code === 0) resolve();
        else reject(new Error(err || `rembg exit ${code}`));
      });
    });
    return await fs.readFile(outPath);
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
}
