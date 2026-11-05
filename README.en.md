<p align="center">
  <img src="docs/screenshots/workspace-dropdown.png" alt="Better Session Topbar — workspace dropdown" width="100%">
</p>

<p align="center">
  <img src="https://img.shields.io/github/v/release/xinspark/dsh-better-session-topbar?style=flat&amp;label=release&amp;color=08C" alt="GitHub release">
  <img src="https://img.shields.io/badge/plugin-UI%20enhancement-47848F?style=flat" alt="UI enhancement plugin">
  <img src="https://img.shields.io/badge/DSH%20Web%20GUI-Windows%20%7C%20macOS%20%7C%20Linux-4493F8?style=flat" alt="Windows | macOS | Linux">
  <img src="https://img.shields.io/badge/license-MIT-2EA44F?style=flat" alt="MIT License">
  <a href="https://github.com/xinspark/dsh-better-session-topbar/actions/workflows/ci.yml"><img src="https://github.com/xinspark/dsh-better-session-topbar/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
</p>

<p align="center"><sub><a href="README.md">简体中文</a> · English</sub></p>

<h3 align="center">Replace the DSH topbar session title with a two-level "Workspace / Session" breadcrumb — switch right from the topbar</h3>

<p align="center"><a href="#install"><ins><code>dsh plugin --profile web add dsh-better-session-topbar</code></ins></a></p>

Better Session Topbar (the package and the repository are both `dsh-better-session-topbar`) is a **session-topbar enhancement plugin** for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) — pure UI enhancement, no new capabilities, no system source changes. DSH's native topbar shows only the session title (an ancestry breadcrumb) in the center, while workspace/session switching lives in the left sidebar; when the sidebar is collapsed, every switch costs extra clicks. This plugin puts the switching entry right into the topbar:

- **Workspace dropdown** — all workspaces with their session counts, one-click switch, plus "Add workspace" (handed straight to the host picker: on a native host that is the OS folder dialog, on a browse host the official in-app panel) and delete.
- **Session dropdown** — all sessions of the current workspace with relative timestamps, one-click switch, plus "New session".
- **The three native topbar chips are brought in line too** — 子智能体 / 智能体团队 / 后台任务 and the breadcrumb share one set of metrics (type size, padding, corners, hover fill, icon size) and give way in a fixed order: chips drop to their counters → the title steps aside for icons → the chips become icons.
- **Two narrow-screen displays** — when the row truly runs out of room, pick **Breadcrumb** (folds to icons; every level stays clickable) or **Session title** (the row keeps only the title). Each option's trade-off is written next to it on the plugin page.

The inline "more" entry calls the host's own context-menu service: pin / rename / fork / copy Session ID / archive / delete workspace, with permission gating, shortcut keycaps and the rename/delete dialogs all rendered by DSH — identical to the native sidebar menu, with no second menu for this plugin to maintain.

Works on **Windows · macOS · Linux** (DSH Web GUI) — plain JavaScript, no native dependencies, no build step for distribution.

> Verification baseline: **DSH NEXT 2.0.22-next (bundling DeepSeek Harness 0.2.2-rc.1)** and `dsh web`. The inline "more" menu needs the `contextMenus` service from 0.2.2-rc.1; on earlier kernels (0.2.1-rc.4 / 0.2.1-rc.3 / 0.2.1-rc.2 / 0.2.0-rc.2) the breadcrumb and both dropdowns still work, but rows show no "⋯" (the sidebar remains the full entry). Other versions are untested.

## Install

`dsh-better-session-topbar` is a **bundle** — a configuration patch layer distributed as a package (see the [official DSH plugin publishing docs](https://deepseek-harness.github.io/deepseek-harness/develop/basic/publish)). Install it into a profile with `dsh plugin`: it links the package and appends it to `dsh.profile.bundles`:

```sh
# from npm (recommended, shortest; published to registry.npmjs.org)
dsh plugin --profile web add dsh-better-session-topbar

# from GitHub (equivalent; pins a tag or commit)
dsh plugin --profile web add github:xinspark/dsh-better-session-topbar#v2.0.1
```

- **Consider locking a commit**: a GitHub install pulls the repository source, so later pushes don't silently change what you run. To pin the exact content, use `github:xinspark/dsh-better-session-topbar#<commit-sha>` (as recommended by the official docs).
- **Local directory / tarball** (development or offline; the local folder and the package now share the name `dsh-better-session-topbar`):

  ```sh
  dsh plugin --profile web add ./dsh-better-session-topbar
  dsh plugin --profile web add ./dsh-better-session-topbar-2.0.1.tgz
  ```

Then start the Web UI: `dsh web` (or `dsh --profile web`). The first `add` auto-initializes the profile with `@deepseek-ai/dsh-base`.

Uninstall: `dsh plugin --profile web remove dsh-better-session-topbar` (removes the dependency and the composition layer; `dsh plugin` keys on the package name, not the repository directory).

The bundle patch (`cordis.patch.yml`) registers both the host and client halves automatically. The client half is served on demand: client changes apply after a page refresh; host changes need a restart.

## Features

| Capability | Description |
| --- | --- |
| Multi-level breadcrumb | The topbar shows "Workspace / Session", each segment expanding its own dropdown; inside a subagent session it grows to "Workspace / parent / subagent session" (ancestor levels navigate back). |
| Per-level icon fallback | Levels fall back to icons only when the topbar genuinely runs out of room: **the whole row overflows → every level collapses** (so it is never cut off at the window edge), and **a level squeezed below a readable width** (visible label < 80px ≈ 5 CJK characters) → that level collapses. Icons are per level (workspace = folder, plain session = session glyph, subagent = the native switcher's up/down chevrons); the full title stays in the tooltip and the accessible name. A level whose title merely exceeds its own cap keeps the truncated text — that carries more information than an icon. The `/` separators always stay, so the hierarchy remains readable in icon form. |
| Width ladder | When the row runs out of room the segments give way in one fixed order: the three native chips (子智能体 / 智能体团队 / 后台任务) go `full → count` (label replaced by the `(N)` badge) → **the whole breadcrumb collapses to icons** (the counters survive, a long title is the least valuable thing on the row) → the chips go `count → icon`. Every decision comes from the measured free width, never from a remembered header width, so a longer title or a vanished chip unfolds by itself. |
| Narrow-screen display | Two options on the plugin page: **Breadcrumb** (the default — keeps the workspace / session levels, each still clickable for switching after folding to icons; the cost is that at the narrowest only icons remain, so the full title needs a hover or a click) or **Session title** (the row keeps only the current session title — the parent / current pair inside a subagent session — so long titles stay readable; the cost is that the workspace and switching move into the dropdown, and at the narrowest the parent becomes the up/down arrow glyph). Both take effect at the same fold point and preview live. |
| Chip parity | The three native chips share one anatomy — icon · label · (N) · ring · chevron — with identical 12px/18 type, `3px 7px` padding, 5px gap, 28px height, 14px icon, 12px chevron, corners and hover fill. What the native ones lack is added (the team chip gets a member count and a running ring phase-pinned to the official spinner), and what one of them orders differently is normalised (the jobs chip's running dot moves after the counter). |
| Workspace dropdown | Workspace list (session-count meta), Add workspace (handed to the host, same as the sidebar +), row "more": rename / delete workspace (the host menu, shown by permission). |
| Session dropdown | Session list of the current workspace (relative-time meta), New session, row "more": pin / rename / fork / copy Session ID / archive session (the host menu, shown by permission). |
| Native-consistent interactions | The dropdown is a self-drawn layer that reuses the native menu tokens (`--dsw-elevation-prominent`, `--dsw-radius-lg`, `--dsw-menu-surface-fill` + `--dsw-menu-backdrop-filter`, hover fill `--dsw-alias-interactive-bg-hover`); its row metrics are min-height 40 / padding 8·10 / 14px·22px (matching the native `AccountMenu` `[role=menuitem]`; the native `Menu.module.css` is more compact and this plugin does not follow it). Its keyboard/ARIA model mirrors the native `Menu`: focus the first row on open, `ArrowUp/Down`, `Home/End`, `Tab` closes, `Esc` closes and returns focus. The inline "more" menu **is the host's own** (`contextMenus`): entries, order, permission gating, shortcut keycaps and the rename/delete dialogs all come from ui-workspace; this plugin only passes the target and the viewport point. |
| Shared lifecycle | The host menu follows its owning dropdown: it is taken down with it (outside click / Escape / selection / switching) — no orphan overlay. |
| Plugin page | Plugins → this plugin → Configure: **narrow-screen session title display** (a two-option selector shaped like DSH's own appearance cubes — Breadcrumb / Session title, each with its trade-off spelled out) and the **probe log** switch. Both apply immediately and persist to the profile's Cordis patch. The page ends with one line: "⭐ Finding it useful? Star it on GitHub", rendered in the host's detail-section slot **above** the market source row ("View repository"); this line adds no link itself. |
| Languages | All plugin-owned copy follows the eight DSH languages (zh / en / ja / de / es / fr / pt / ru) live, with a per-language `locale/*.json` meta title and description. **The ja / de / es / fr / pt / ru copy is machine translation** (lightly proofread) — see Known limitations. |

## Screenshots

**Workspace dropdown open** — switch workspaces, new workspace:

![Workspace dropdown](docs/screenshots/workspace-dropdown.png)

**Session dropdown open** — switch sessions, create new:

![Session dropdown](docs/screenshots/session-dropdown.png)

**Session "more" menu** — the row-end "⋯" opens the host session menu (pin / rename / fork / copy Session ID / archive):

![Session more menu](docs/screenshots/session-more-menu.png)

**Subagent ancestry crumb** — inside a subagent session the breadcrumb grows to "Workspace / parent / subagent session"; ancestors navigate back and the last level opens the sibling subagents:

![Subagent crumb](docs/screenshots/subagent-crumb.png)

**Narrow screen, session-title display** — once the full breadcrumb no longer fits, the row keeps only the current session title (clicking it opens the same session list and inline actions):

![Narrow session title](docs/screenshots/narrow-title.png)

**Plugin page** — the two display options with their trade-offs, plus the probe log switch:

![Plugin page](docs/screenshots/plugin-settings.png)

## Usage

After installation, open any session — the topbar center shows the "Workspace / Session" breadcrumb:

- Click the **workspace** side: the workspace dropdown opens ("Add workspace" on top).
- Click the **session** side: the session dropdown opens ("New session" on top).
- Hover a row: the "⋯" entry appears at the row end — it opens the host's own context menu (pin / rename / fork / copy Session ID / archive, shown by permission).
- Select a row to switch; click outside or press `Esc` to close the dropdown.
- Keyboard: once open, `↑` / `↓` and `Home` / `End` move, `Tab` closes, `Esc` closes and returns focus to the trigger.
- When the topbar runs out of room it gives way in the fixed order above; to change the narrow-screen display, open Plugins → Better Session Topbar → Configure.

## Documentation

| What you want | Where |
| --- | --- |
| Full documentation index | [docs/README.md](docs/README.md) |
| Design and trade-offs (ladder / chips / menu delegation) | [docs/design.md](docs/design.md) |
| Assembly contract (three names / slots / services / DOM anchors) | [docs/reference/architecture.md](docs/reference/architecture.md) |
| Version compatibility and upgrade reconciliation | [docs/reference/compatibility.md](docs/reference/compatibility.md) |
| Settings and when they apply | [docs/guide/configuration.md](docs/guide/configuration.md) |
| Troubleshooting (symptom → cause → fix) | [docs/guide/troubleshooting.md](docs/guide/troubleshooting.md) |
| Acceptance record (gates + manual checklist) | [docs/testing.md](docs/testing.md) |
| Pitfalls (symptom → root cause → evidence) | [docs/experience/](docs/experience/README.md) |
| Maintainer handbook (release / approvals / market) | [MAINTAINING.md](MAINTAINING.md) |

## Relationship with DSH

This project is built on the official [deepseek-ai/deepseek-harness](https://github.com/deepseek-ai/deepseek-harness) and is a **community plugin** — not an official DeepSeek product. Everything it shows is DSH's own data and UI, re-arranged; no system source changes.

## Development

- **`index.js`** — host half: it only declares the schema of the two settings (`narrowMode` / `probeLog`); every piece of UI logic lives in the browser half.
- **`lib/client.js`** — browser half (UMD, registered into DSH `clientModules`). Structure, top to bottom:
  1. Local utilities: style injection / timers.
  2. **Dictionaries** (`BST_ZH` / `BST_EN` / `BST_JA` / `BST_DE` / `BST_ES` / `BST_FR` / `BST_PT` / `BST_RU`, all with the same key set) — registered into `ctx.locale` and following the language switch; `bstT()` falls back gracefully.
  3. **Self-drawn dropdown** `BstList` — native menu styling and tokens; the keyboard/ARIA model mirrors the native `Menu` (`role=menu` with two `menuitem`s per row, focus the first row on open, `ArrowUp/Down`, `Home/End`, `Tab`/`Esc` close); viewport-aware positioning; outside close on `click` (not mousedown/pointerdown: those dispatch before `click`, unload the list first and swallow inline clicks).
  4. `WorkspaceTitleBreadcrumb` — registered into `conversation.session.header.actions` (`order: -40`, leftmost in the topbar); per-level icon fallback (a level drops its text only once the topbar squeezes it below `ICONIC_TEXT_FLOOR` of visible label width) plus the decoration and width ladder for the three native chips (every decision comes from the measured free width, `avail()`; **no** header-width hysteresis — folds are usually caused by a rename or a newly appeared chip, and a fold keyed on header width never comes back). The inline "more" does not render a menu at all: it hands `{kind, value}` to the host's `contextMenus.open(target, viewport-point)` and takes that menu down whenever all of its dropdowns close.
  5. `apply(ctx)` — style injection + slot registrations (topbar breadcrumb and the plugin page); `inject: ['slots','workspaces','uiWorkspace','locale']` (declaring the service dependencies matters: if `apply` wins the race, `undefined` handles get captured permanently and every action dies silently while the UI still looks perfect), and services are read directly as `ctx.<service>` like the official plugins. **Optional** dependencies all go through `ctx.inject([...], …)` children: `configForms` (plugin page), `shortcuts` (`workspace.add` liveness), `contextMenus` (the inline "more") — without them you only lose that one entry, never the breadcrumb.

- **Minimum check after a change** — `npm test`: `test/render-smoke.cjs` runs the factory and the breadcrumb / settings render bodies against stub React and primitives and enforces the eight locale key sets, the `locale/*.json` metas and the star line; `tools/check-docs.mjs` validates documentation links and anchors. It says nothing about appearance, so still click through the DSH upgrade checklist before a release.

Quick reference:

- **Add a row action** — not here: the inline menu comes from the host, whose entries are registered per `target` in ui-workspace. This plugin only decides which rows carry `more` (see `wsListItems` / `ssListItems`).
- **Add copy** — the eight dictionaries (`BST_ZH` / `BST_EN` / `BST_JA` / `BST_DE` / `BST_ES` / `BST_FR` / `BST_PT` / `BST_RU`) share one key set, so a new key must be added to all eight; `npm test` enforces the key sets and fails otherwise.
- **Add the star prompt line to another plugin's page (the shared pattern)** — register the official `plugins.detail.section` (`id: bst-star`, `order: 80`, below the market source row's 90) and filter by `subject.pkg.name` so other plugins' pages return `null`; the star is the `⭐` character (no hand-drawn icon) and the line adds **no** "view repository" link (the host footer already has one), which keeps the intrusion minimal.
- **Tweak dropdown styles** — edit the `.bst-item*` rules in `insertStyle` (tokens match the native Menu).
- **Diagnostics are off by default; the switch lives on the plugin page** — normal use writes nothing to the console. Turn on **Probe logs** under Plugins → this plugin → Configure (applies immediately, no reload). The three prefixes are `[bst-dom]` (structural probe), `[bst-chip]` (chip discovery and ladder conclusions) and `[bst-perf]` (only emitted when a single pass takes longer than 60ms). While it is off, even the structural probe's measurements are skipped. The value is stored in the profile's `cordis.patch.yml`, so it follows the profile.
- **A host-half change does not need an app restart** — verified live: client changes apply on refresh, and an `index.js` change is picked up by toggling this row off and on in the Plugins page (`已关闭 → 运行中`), which re-imports it so a newly declared `Config` takes effect immediately.
- **Changing a package title/description in `locale/*.json` needs an app restart** — that package metadata is read **at host boot** (measured: app started 17:59, `locale/ja.json` added 18:29, a page refresh still showed English; a restart shows Japanese). The UI dictionaries inside `lib/client.js` are unaffected and apply on refresh.
- **The schema needs schemastery (a peer)** — the host half builds `Config` with `@deepseek-ai/schemastery`, declared as a peerDependency in `package.json`. If you install this repository as a **symlink/junction** while developing, note that Node resolves through the real path, so `@deepseek-ai/schemastery` must resolve from the repository or one of its **parent** directories (this machine's dev tree provides it from the parent `plugins/node_modules`, so the repository's own `node_modules/@deepseek-ai` can stay empty). A real-directory install (`dsh plugin add`) does not need this.
- **The narrow-screen mode is an enum, not a boolean** — `narrowMode` is `'crumb' | 'title'` (host side: `z.union([z.const(...), z.const(...)])`). Up to 1.3.4 the stored field was the boolean `narrowTitle`; after the rename the old value is dropped by the schema, so the plugin falls back to the default Breadcrumb display — pick the other option on the plugin page.
- **Why the selector is not a SegmentedControl** — the native `SegmentedControl` is tablist → panel semantics (each option carries an `aria-controls` pointing at a panel); there is no panel here, so it would emit dangling `aria-controls` references. The two-option selector reuses the cube DSH itself uses for its appearance picker: `.5px` border, `--dsw-radius-xl`, selected state swapping to `--dsw-alias-bg-module-platform` + `--dsw-static-neutral-bluish-400`, with `aria-pressed` carrying the selection.
- **Invariants of the narrow title state** — (1) the workspace level is hidden with `display: none` via `data-bst-level="ws"`; do **not** stop rendering it, because `crumbNeed` is derived from the `.bst-crumb-btn` count and removing it drops the threshold from 285 to 151, which makes the layout flap between hidden and shown; (2) the state forces the text form (`setIconic('')`), otherwise the ladder would fold the last level into a glyph, which contradicts what a title is; (3) the session icon lives inside `span.bst-crumb-icon` and is hidden only in this state — the wide breadcrumb keeps it; (4) inside a subagent session the `parent / current` pair compresses one step further: when `per` bottoms out (150) the parent turns into the native up/down switcher glyph and gives its width to the title, expanding again at 190 — the glyph is the **exception** to the icon hiding (`.bst-crumb-iconic .bst-crumb-icon` must be restored in this state), otherwise collapsing would leave an empty button.
- **The package name must be ASCII, and three places must agree** — `package.json`'s `name`, the row id in `cordis.patch.yml`, and the `id` in `lib/client.js`'s `__ModuleLoader__.load({ id })` are the same string: the host resolves the bundle by package name and serves the factory under that key, and the browser waits for exactly that key — a mismatch means a factory that never arrives or an import failure. The Chinese display name (更好的会话顶栏) lives only in `locale/*.json`'s `meta.title` and the host half's `name` string. **A CJK package name does not work**: `npm install` fails outright with `EINVALIDPACKAGENAME` (`name can only contain URL-friendly characters`), and every `dsh plugin add/remove` in a profile goes through npm.
- **A package rename does not converge in a running host** — after updating the profile's `dependencies`, `dsh.profile.bundles`, patch row id and `node_modules` link, the on-disk state is correct, but the running host keeps the pre-rename row in its live composition (a bundle's contributed rows are not unloaded when the bundle leaves `bundles`). A page refresh then reports "failed to load plugins / 1 entry did not activate … import failed", and `disabled: true` in the patch does not override it. **The app must be restarted once**; the stale row disappears on the next boot.
- **Adding a setting touches two places** — declare the field in the host half's `Config` schema and mark it `.volatile()` (only volatile fields ride the form; a schema without one makes the whole row disappear); then add a control in `BstSettingsPage`, reading `configForms.get(row id)` and writing through the same instance with `set(field, value)`. The topbar reads the shared `bstSettings`, which is recomputed whenever the form changes.
- **Change the width ladder** — the ladder is `full → count → icons → icon` and its thresholds are three constants: `CRUMB_LEVEL_COST` / `CRUMB_SEP_COST` (turned into `crumbNeed` from the current level count; 285 for two levels), `CRUMB_ICON_NEED` (160 — only below that does a chip become an icon) and `CRUMB_TEXT_ADD` (136, the margin required to unfold). Recompute them if you touch type size, padding or icon size — do not hard-code an integer. Do **not** add a `header.clientWidth` hysteresis: folds are usually caused by content changes (a rename, a new chip), and a fold keyed on header width never comes back. The chip metrics live in the `button[data-bst-chip]` rules; the decoration (counter, ring, dot order) is driven by the `data-bst-chip-*` markers.
- **Change the icon-fallback threshold** — the threshold is `ICONIC_TEXT_FLOOR` (≈5 CJK characters wide): a level falls back to its icon only when its label is truncated *and* its visible width is below it, or when the whole row overflows. Two traps: (1) do not use "the title exceeds this level's `max-width`" as the predicate — that also matches in a wide window (a long title exceeds the cap by nature) and the UI would turn into icons everywhere; (2) do not assume the label always gets squeezed — topbar containers are not shrinkable by default, and the overflow shows up as clipping at the window edge instead (see the `has(.bst-crumbs)` rule that makes them shrinkable).
- **Add another chain level** — change `bstSessionChain` (data) only; the render path is one shared block per level, with the icon picked by `node.subagent` (subagent = up/down chevrons, otherwise the session glyph), so no chain length can produce a level without an icon.
- **The dropdown must be portaled into `document.body`** — rendered in place inside the topbar slot it sits in the header's stacking context, so page content (including a third-party plugin's injected `复制` button) paints over it, and the app shell's sidebar column can cover its first row. The native `Menu`'s `portal: true` exists for the same reason.
- **Do not reuse the native wording for action rows (when a "mobile pocket" plugin is installed)** — measured: `dsh-pocket` 2.11.0 `hideWsEntries` scans every `[role=menuitem]`/`[role=option]`/`li`/`button`/`a` and hides the ones whose text **exactly** matches `添加工作区` / `Add workspace`, with a `MutationObserver` that keeps newly inserted nodes hidden too; keeping our own wording (`新建工作区` / `New workspace`) avoids it. That plugin is not in this profile, so the row deliberately uses the native wording again (the owner asked for it); switch the action row to our own wording if it is ever installed.
- **"Add workspace" is handed to the host; the plugin draws no panel** — the sidebar `WorkspacePickFlow` is `addOnly: true`, so `open` rises straight into `sidebar.workspaces.directoryFlow` and the host occupant decides: a native backend (win32/darwin local) is the official renderless `NativeDirectoryFlow` and opens the OS folder dialog; a browse backend is the official in-app panel. The plugin only calls `workspace.add`. When the hole is empty (rare) it falls back to the preload bridge `__DSH_DIRECTORY_PICKER__` → `uiWorkspace.pickDirectory()` → a plain error; it never draws its own panel and never degrades to path input. 1.5.0 removed the old self-drawn panel and the `priority:-1` takeover. `[bst-picker]` in the probe log tells the host flow and the fallback apart.

## DSH upgrade checklist

This plugin sits on DSH's internal contracts (there is no stable third-party API), so re-check this table after every DSH upgrade. The detailed contract and the ten coupling points live in [Assembly contract](docs/reference/architecture.md); the upgrade runbook is in [Version compatibility](docs/reference/compatibility.md).

| Check | Where | How to verify after an upgrade |
| --- | --- | --- |
| Package name in three places | `package.json` name / `cordis.patch.yml` row id / `__ModuleLoader__.load({id})` | The plugin loads; no "import failed" |
| Slot names | `conversation.session.header.actions`, `sidebar.workspaces.directoryFlow`, `conversation.hero.workspace.directoryFlow`, `plugins.row.config` | Run `npm run check:instance` first (it reads the asar and checks each item), then use `cordis_inspect_query` for the names and props; sibling order changes between versions (rc.3 / rc.4: team -20, preset -10, subagent-catalog 10, job-list 20, plus cost-meter 1 in rc.3/rc.4; 0.2.2-rc.1 measured without cost-meter) and the plugin only relies on its own -40 |
| Services | required `slots` / `workspaces` / `uiWorkspace` / `locale`; optional `configForms` / `shortcuts` / `contextMenus` | Dropdown actions work, the settings page exists; on 0.2.2+ the "more" entry opens the host menu |
| Inline "more" | the host's `contextMenus` service (provided by `ui-context-menu`) + ui-workspace's `registerSessionMenus` (pin / rename / fork / copy ID / archive) | Open "⋯" on any row: the host menu must appear; the two matching `check:instance` items must PASS |
| Directory interaction | the plugin **takes nothing over and draws no panel**: `workspace.add` → the host occupant (native = official renderless → OS chooser; browse = official in-app panel); only an empty hole falls back to the preload bridge `__DSH_DIRECTORY_PICKER__` / `pickDirectory()` | Click "Add workspace" once in each of desktop window / web / community desktop / community web: a native host must show the OS dialog, a browse host the official in-app panel |
| Topbar DOM anchors | `header[data-window-drag]` + `nav:has(~ div .bst-crumbs)` (0.2.0's `data-conversation-*` are gone) | Native title hidden, narrow-screen switch works |
| primitives | `Modal` / `Button` / `Switch` / `*Regular` icons (`Menu` / `Input` left with the self-built menu) | Open the error dialog and the plugin settings page |
| Copy keys | plugin-owned wording only (add workspace / new session); the inline menu's copy belongs to the host namespace | Check zh and en |

## Known limitations

- **The inline "⋯" needs DSH 0.2.2-rc.1+** (the `contextMenus` service). On earlier kernels the breadcrumb and both dropdowns still work; the entry is simply absent — the sidebar remains the full entry, and this plugin keeps no second menu. The star line also needs 0.2.2-rc.1+ (`plugins.detail.section`); older kernels just lose that one line.
- **The plugin's own copy**: all eight official languages are covered (zh / en / ja / de / es / fr / pt / ru) and follow the DSH language switch live.
- **The six added languages are machine translation** (ja / de / es / fr / pt / ru, lightly proofread), so some phrasing may read unnaturally or miss your preferred terminology — issues and pull requests are welcome: the copy lives in `BST_JA` / `BST_DE` / `BST_ES` / `BST_FR` / `BST_PT` / `BST_RU` in `lib/client.js`, and the package title/description in `locale/*.json`. Chinese and English are written by hand.
- **Relative links in the npm README**: on the registry-rendered package page, relative links into `docs/` and the screenshots may 404 (they work on GitHub); treat the GitHub repository page as the source of truth.
- **The three native chips are decorated through official label matching**: all eight languages of 0.2.2 (zh / en / ja / de / es / fr / pt / ru) are covered; when DSH adds a language, add its stems to `CHIP_HINTS` (see MAINTAINING §7). The breadcrumb itself is language-independent.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md); report security issues privately per [SECURITY.md](SECURITY.md).
Run `npm test` (render smoke + locale key sets + docs links) before opening a pull request.

## Acknowledgments

Thanks to [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) and the DeepSeek AI team — the agent, models, tools, sessions, Web UI and plugin ecosystem all come from this project; to [Cordis](https://github.com/cordiverse/cordis) for the plugin foundation; and to the [Koishi.js](https://koishi.chat/) community for its long-standing plugin practices, tooling and experience.

## License

[MIT](LICENSE) — fully open source and free.

Better Session Topbar is a community plugin for DeepSeek Harness — **not a DeepSeek official product**.
