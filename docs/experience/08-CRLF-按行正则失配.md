# 08 · 行尾被写成 CRLF：按行正则失配 + 整文件 diff

- 日期：2026-11-15
- 类别：门 / 工具脚本

## 症状

两个现象同一天出现，看起来不像同一件事：

1. 给 `tools/check-instance.mjs` 新增「chip 结构锚点」后，脚本直接吐
   `lib/client.js no longer declares CHIP_ANCHORS` —— 那段常量就在源码里，肉眼可见。
2. `git diff --stat` 里 `lib/client.js` 显示 **5065 行变更**（整个文件），而实际只加了 60 来行。

## 根因

`lib/client.js` 在某次落盘时被写成了 **CRLF**，而仓库里存的是 **LF**（`HEAD:lib/client.js`
一个 `\r` 都没有，仓库也没有 `.gitattributes` / `core.autocrlf`）。于是：

- 脚本里按行尾写的正则匹配不上：

  ```js
  source.match(/const CHIP_ANCHORS = \{([\s\S]*?)\n {12}\}\n/)   // 文件里是 \r\n
  ```

- git 按内容比对，行尾一变就是「每行都改了」。

## 证据（可复跑）

```sh
python -c "import subprocess;cur=open('lib/client.js','rb').read();head=subprocess.run(['git','show','HEAD:lib/client.js'],capture_output=True).stdout;print(cur.count(b'\r\n'),head.count(b'\r\n'))"
# 改前：2556 0        ← 工作树全 CRLF，仓库全 LF
# 改后：0 0

sed -n '1184,1190p' lib/client.js | cat -A | head -3   # 改前每行都以 ^M$ 结尾
node tools/check-instance.mjs                          # 改前：no longer declares CHIP_ANCHORS
git --no-pager diff --numstat lib/client.js            # 改前 2556/2509；改后 62/15
```

## 结论与做法

1. **读源码先归一化**，不在各处重复 `readFileSync`：

   ```js
   function pluginSource() {
     const raw = fs.readFileSync(path.join(ROOT, 'lib', 'client.js'), 'utf8')
     return raw.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n')
   }
   ```

   顺带去掉 BOM（编辑器带 BOM 保存时，第一行匹配同样会失配）。

2. **把行尾本身变成门**：`test/render-smoke.cjs` 的静态契约场景现在断言
   `lib/client.js` 里不能出现 `\r\n` —— 仓库约定的就是 LF，混进来立刻红，而不是等到
   某条按行正则失效、或者 code review 里冒出整文件 diff 才发现。

3. 判断「文件是不是被整体改过」的快捷信号：`git diff --numstat` 的插入数远大于你实际改的行数。
   见到这种数字先查行尾，别急着读 diff。
