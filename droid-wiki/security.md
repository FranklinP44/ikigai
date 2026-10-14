# Trust boundaries

The deployed app is a static browser page; privileged build, review and wiki-publishing tools run separately. This page describes source-visible boundaries and their limits, not a vulnerability audit or assurance about external service settings. See [Configuration](reference/configuration.md) and [Deployment](deployment.md).

## Browser content and rendering

`src/main.ts` imports zone text, examples and chip names/colors from `src/data.ts`. `render()` assigns eyebrow, title and description with `textContent`, but builds chip markup and example list items with `innerHTML`. Its comment explicitly trusts static repository content. There is no runtime CMS fetch, login, backend, or persistence in the application modules.

`src/data.test.ts` checks that examples contain none of `<`, `>`, `&` or `"`, alongside content/key invariants. This is a check of the committed examples, not a general sanitizer; chip names and colors are also repository-trusted inputs. Before introducing URL parameters, remote content or user-authored text into these templates, replace the string rendering with appropriate DOM/text operations or establish a separately reviewed sanitization boundary.

Explore-button `data-zone` values pass through `isZoneKey()` in `src/main.ts` before selecting a zone. `src/geometry.ts` also validates computed membership with that guard. This validates the finite key set; it is not HTML escaping or an authorization mechanism. The app has no account-level authorization to enforce.

## Public assets and external fonts

`vite.config.ts` builds relative asset URLs, and `.github/workflows/deploy-pages.yml` deploys `dist/` to public GitHub Pages. Treat bundled code and any inlined values as public. The application reads no environment variables, and `.env.example` is unnecessary for normal npm commands.

Vite exposes `VITE_`-prefixed environment variables to client code. Do not prefix credentials this way or import tool secrets into application code. The unprefixed Confluence variables are consumed by the Python tool, not the current browser modules; that separation is not a guarantee against future code explicitly embedding a secret.

`index.html` requests a Google Fonts stylesheet from `fonts.googleapis.com` and preconnects to that host and `fonts.gstatic.com`. Fraunces, Inter and Noto Serif JP therefore depend on an external font service and browser network requests. `src/styles.css` supplies serif/system-font fallbacks; this is not an entirely offline/self-hosted resource set.

## Tool credentials and local files

`.github/workflows/publish-wiki-to-confluence.yml` passes `CONFLUENCE_EMAIL` and `CONFLUENCE_API_TOKEN` from repository Actions secrets, and site/space plus optional root/parent settings from Actions variables, only to configuration/publishing steps. These credentials are separate from the Pages build. `.github/scripts/publish_confluence.py` uses them for authenticated Confluence API requests.

`.env.example` documents equivalent local tool variables. The Python script does not load `.env` automatically; the template shows explicit shell export. `.gitignore` excludes `.env` and `.env.*` except `.env.example`, along with `build/`, coverage/test reports, installed packages, caches and logs. Git ignores are an accidental-addition safeguard, not secret scanning, encryption, or protection for tracked/force-added files.

The publisher's `--dry-run` still writes local previews and renders diagrams. With all four required Confluence variables present, it performs read-only remote checks; without them it skips those checks. Without `--dry-run`, it creates/updates Confluence content. `.github/workflows/publish-wiki-to-confluence.yml` uses dry runs for PR events and real publishing for eligible pushes to `main` or manual runs unless dry-run is selected. Read-only GitHub repository permission does not prevent Confluence writes through a separate API token.

Diagram rendering uses `.github/scripts/puppeteer-config.json`, which disables Chrome's sandbox with `--no-sandbox`. This is a workflow rendering setting, not browser application behavior or a sandbox guarantee. The script and Markdown/diagram inputs should remain trusted tooling inputs.

## Wiki generation versus GitHub publication

`.github/workflows/droid-wiki-refresh.yml` gives the generation job `contents: read`. It reads repository/history and restores previous wiki files from the rolling branch, then runs Droid with a step-scoped `FACTORY_API_KEY` secret. It generates local files and uploads to Factory, so “read-only” means GitHub repository permissions, not absence of filesystem or external writes.

Generation disables `wiki-video-gen`, explicitly requests Factory-only upload without GitHub wiki sync, and fails if a video directory appears. A one-day artifact carries pages and hidden metadata, excluding image/video directories, to a separate job. These configured controls express workflow intent; they are not a general containment mechanism for the agent or a guarantee that nothing was uploaded before a later guard fails.

Only the separate `wiki-publish` job has `contents: write` and `pull-requests: write`. It downloads the generated artifact and uses a commit-pinned pull-request action to update `factory/droid-wiki`, limiting added paths to the wiki and excluding images/video. This separates repository-writing credentials from the generation job; it does not establish that generated text is correct.

The rolling PR uses the built-in GitHub token, so other workflows do not automatically run on it. `AGENTS.md` asks for diff review before merge. A wiki merge can trigger the separate Confluence workflow. Factory upload, GitHub branch/PR publication, and Confluence publication are distinct destinations and authority boundaries. See [Wiki refresh](features/wiki-refresh.md).

## Review and dependency safeguards

`.github/workflows/deploy-pages.yml` checks AGENTS consistency, lint, formatting, coverage and the type-checked build before deploying; PRs do not enter its deployment job. `vitest.config.ts` requires 100% coverage of pure modules, excluding DOM-dependent `src/main.ts`. Raw-source tests do not prove browser behavior or security.

`.github/workflows/droid-review.yml` gates automated code and shallow security review on a non-draft PR carrying `droid-review`; it is not always-on approval or an exhaustive audit. The review job has GitHub write permissions and a Factory secret, unlike wiki generation's repository-read-only job. `.github/workflows/droid.yml` separately gates assistant interactions on `@droid` text and can write issue/PR comments. `.github/CODEOWNERS` names the owner, but source files alone do not show enforced branch protection or required approvals.

`package-lock.json` fixes npm resolutions, `.github/scripts/requirements.txt` pins Python versions, and `.github/dependabot.yml` schedules updates with release cooldowns and Node-floor exceptions. Most Actions use version tags; `Factory-AI/droid-action@main`, the Factory CLI installer, and the Mermaid major range remain moving inputs. These are current configuration choices, not freshness or supply-chain-safety claims. See [Dependencies](reference/dependencies.md).
