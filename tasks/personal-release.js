// @ts-check
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {createWriteStream} from 'node:fs';
import {cp, mkdir, readFile, readdir, rm, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {pipeline} from 'node:stream/promises';
import {fileURLToPath} from 'node:url';

import yazl from 'yazl';

const root = fileURLToPath(new URL('../', import.meta.url));
process.chdir(root);
const config = JSON.parse(await readFile('personal-release.json', 'utf8'));
const parts = String(config.version).split('.');
if (parts.length !== 3 || !parts.every((part) => /^(0|[1-9]\d*)$/.test(part) && Number(part) <= 65535) || parts.every((part) => part === '0')) {
    throw new Error('personal-release.json needs a nonzero Chrome-compatible three-part version.');
}
const tag = `personal-v${config.version}`;
const args = process.argv.slice(2);
if (args.some((arg) => arg !== '--check' && arg !== `--tag=${tag}`)) {
    throw new Error(`Expected --tag=${tag}, --check, or no arguments.`);
}
const git = (...args) => execFileSync('git', args, {encoding: 'utf8'}).trim();
const commit = git('rev-parse', 'HEAD');
const dirty = git('status', '--porcelain', '--untracked-files=all') !== '';
if (args.includes(`--tag=${tag}`)) {
    if (dirty || git('rev-parse', `refs/tags/${tag}^{commit}`) !== commit) {
        throw new Error('A tagged release requires a clean checkout at the matching tag.');
    }
}
if (args.includes('--check')) {
    console.log(`Release configuration valid: ${tag}, commit ${commit}, dirty=${dirty}`);
    process.exit(0);
}

// Build fresh, rather than packaging potentially stale output from another source revision.
execFileSync(process.execPath, ['--max-old-space-size=3072', 'tasks/cli.js', 'build', '--release', '--chrome-mv3'], {stdio: 'inherit'});
const output = 'build/personal-release';
const extension = `${output}/extension`;
await rm(output, {recursive: true, force: true});
await mkdir(output, {recursive: true});
await cp('build/release/chrome-mv3', extension, {recursive: true});
const manifest = JSON.parse(await readFile(`${extension}/manifest.json`, 'utf8'));
const upstreamVersion = manifest.version;
manifest.name = config.name;
manifest.version = config.version;
manifest.version_name = `${config.version} (upstream ${upstreamVersion})`;
manifest.author = 'Nulifyer; based on Dark Reader by Alexander Shutau and contributors';
manifest.homepage_url = 'https://github.com/Nulifyer/darkreader';
delete manifest.update_url;
await writeFile(`${extension}/manifest.json`, `${JSON.stringify(manifest, null, 4)}\n`);
await cp('LICENSE', `${extension}/LICENSE`);
await cp('docs/GITHUB-INSTALL.md', `${extension}/INSTALL.md`);
const metadata = {name: config.name, version: config.version, upstreamVersion, sourceCommit: commit, dirty, tag: args.includes(`--tag=${tag}`) ? tag : null, distribution: 'unpacked-zip', automaticUpdates: false};
await writeFile(`${extension}/release.json`, `${JSON.stringify(metadata, null, 4)}\n`);

async function listFiles(dir) {
    const files = [];
    for (const entry of await readdir(dir, {withFileTypes: true})) {
        const file = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            files.push(...await listFiles(file));
        } else if (entry.isFile()) {
            files.push(file);
        } else {
            throw new Error(`Unexpected file type in release: ${file}`);
        }
    }
    return files;
}

const filename = `darkreader-personal-${config.version}-chromium.zip`;
const archive = new yazl.ZipFile();
const completed = pipeline(archive.outputStream, createWriteStream(`${output}/${filename}`));
// Fix ZIP timestamps, permissions, and ordering for repeatable packaging.
const mtime = new Date('2000-01-01T00:00:00Z');
for (const file of (await listFiles(extension)).sort()) {
    archive.addFile(file, path.relative(extension, file).split(path.sep).join('/'), {mtime, mode: 0o100644});
}
archive.end();
await completed;
const checksum = createHash('sha256').update(await readFile(`${output}/${filename}`)).digest('hex');
await writeFile(`${output}/SHA256SUMS`, `${checksum}  ${filename}\n`);
await writeFile(`${output}/release.json`, `${JSON.stringify(metadata, null, 4)}\n`);
await cp('docs/GITHUB-INSTALL.md', `${output}/INSTALL.md`);
await cp('scripts/update-darkreader.py', `${output}/update-darkreader.py`);
console.log(`Created ${output}/${filename}${dirty ? ' (local preview with uncommitted changes)' : ''}`);
