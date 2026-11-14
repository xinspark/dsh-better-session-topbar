// 最小 asar 读取器（无依赖）—— `check-instance.mjs` 与 `topbar-drift.mjs` 共用。
//
// 布局：[0..3]=4 · [4..7]=pickleSize · [8..11]=headerPayload · [12..15]=jsonLen
//       [16..] JSON 目录树（文件 = {offset,size}）· 数据区从 8+payload+4 开始。
import fs from 'node:fs'
import path from 'node:path'

// 实例发现：`--asar` → `DSH_APP_ASAR` → `DSH_INSTALL_DIR` → 各平台常见安装路径。
// `DSH_INSTALL_DIR` 由 DSH 托管环境注入，是本机运行实例的 app.asar（也可能是安装目录）。
export function resolveAsar({ argv = process.argv.slice(2), onFail } = {}) {
  const fail = onFail ?? ((message) => { console.error(message); process.exit(2) })
  const flag = argv.indexOf('--asar')
  const explicit = flag >= 0 ? argv[flag + 1] : process.env.DSH_APP_ASAR
  if (explicit !== undefined && explicit !== '') {
    if (!fs.existsSync(explicit)) fail(`app.asar not found: ${explicit}`)
    return path.resolve(explicit)
  }
  const fromInstallDir = (value) => {
    if (typeof value !== 'string' || value === '') return null
    if (value.toLowerCase().endsWith('.asar')) return fs.existsSync(value) ? value : null
    if (!fs.existsSync(value)) return null
    if (fs.statSync(value).isFile()) return value
    for (const leaf of ['resources/app.asar', 'app.asar']) {
      const candidate = path.join(value, leaf)
      if (fs.existsSync(candidate)) return candidate
    }
    return null
  }
  const installed = fromInstallDir(process.env.DSH_INSTALL_DIR)
  if (installed !== null) return installed
  const local = process.env.LOCALAPPDATA ?? ''
  const candidates = [
    path.join(local, 'Programs', 'DSH NEXT', 'resources', 'app.asar'),
    path.join(local, 'Programs', 'dsh-desktop-next', 'resources', 'app.asar'),
    'C:/Program Files/DSH NEXT/resources/app.asar',
    '/Applications/DSH NEXT.app/Contents/Resources/app.asar',
    '/opt/DSH NEXT/resources/app.asar',
  ].filter((entry) => entry !== '')
  for (const candidate of candidates) if (fs.existsSync(candidate)) return candidate
  fail('no app.asar found — pass --asar <path>, or set DSH_APP_ASAR / run inside a DSH session (DSH_INSTALL_DIR)')
  return null
}

export function openAsar(asarPath) {
  const fd = fs.openSync(asarPath, 'r')
  const head = Buffer.alloc(16)
  fs.readSync(fd, head, 0, 16, 0)
  const jsonLen = head.readUInt32LE(12)
  const jsonBuf = Buffer.alloc(jsonLen)
  fs.readSync(fd, jsonBuf, 0, jsonLen, 16)
  const tree = JSON.parse(jsonBuf.toString('utf8'))
  // 数据区起点是 **8 + headerPayload + 4**，不是 `16 + jsonLen`：
  // jsonLen 只是字符串长度，pickle 还会补齐到 4 字节对齐，直接用 16+jsonLen 会整体偏移
  // （踩过一次：读出来的 package.json 在 11999 处 JSON 解析失败）。
  const base = 8 + head.readUInt32LE(8) + 4

  const entries = new Map()
  const walk = (node, prefix) => {
    for (const [name, value] of Object.entries(node.files)) {
      const p = prefix === '' ? name : `${prefix}/${name}`
      if (value.files) walk(value, p)
      else entries.set(p, value)
    }
  }
  walk(tree, '')

  const read = (relPath) => {
    const entry = entries.get(relPath)
    // 符号链接、未打包文件、非法偏移一律当「读不到」，不抛错
    if (!entry || entry.link !== undefined || entry.unpacked === true) return null
    const offset = Number(entry.offset)
    const size = Number(entry.size)
    if (!Number.isFinite(offset) || !Number.isFinite(size) || size <= 0) return null
    const buf = Buffer.alloc(size)
    fs.readSync(fd, buf, 0, size, base + offset)
    return buf.toString('utf8')
  }

  return {
    path: asarPath,
    paths: () => [...entries.keys()],
    read,
    readJSON(relPath) {
      const text = read(relPath)
      return text === null ? undefined : JSON.parse(text)
    },
    close() {
      fs.closeSync(fd)
    },
  }
}
