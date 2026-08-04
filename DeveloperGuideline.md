# Developer Guidelines for vj-servers

This repository hosts multiple backend and frontend services. Follow these steps to work safely across DEV and PROD without unintentionally affecting other apps.

## 1) Repository layout
- **Backends:** auth-server, be12-outpass, be1-complaints, be2-dpd, be3-openhouse, be4-vjbus, be5-wall, be6-activity, be8-undoubt, be9-easyfind
- **Frontends:** fe12-outpass, fe1-complaints, fe2-projects, fe3-openhouse, fe4-vjbus, fe5-wall, fe6-activity, fe7-navi, fe8-undoubt, fe9-easyfind-admin, fe9-easyfind-child, fe-superapp
- **PROD web roots:** `/var/www/{campus,easyfind,easyfind-admin,hostel,keys,navi,openhouse,outpass,passport,projecthub,scanner,thrive,wall,www}` (others currently ignored)
- **Systemd backend services (subset):** auth_server.service, authv2.service, be1-complaints.service, be3-openhouse.service, be4-vjbus.service, be5-wall.service, be6-activity.service, be8-undoubt.service, be9-easyfind.service, be-navi.service, be-outpass.service, be-vjstartups.service, fe4-vjbus.service, fe5-wall.service, projecthub.service, start_backend_servers.service, vjjc.service, hostel_server.service, wikijs.service, keys.service

## 2) Cloning and workspace setup
- Create a dedicated working copy per app to avoid cross-app pulls. Options:
  - **Git worktrees (recommended):** `git worktree add ../wj-app1 main backend/be1-complaints` (repeat per app). Work in each app’s worktree.
  - **Separate clones:** one clone per app directory.
- Install Node.js, npm, and Python (where needed). Use `npm ci` for JS projects and `python -m venv venv && pip install -r requirements.txt` for Python services.
- Copy `.env.example` (if present) to `.env` per service and fill secrets (never commit secrets).

## 3) Working on an issue
- Create/locate a Git issue first. Branch naming: `issue-<id>-<short-desc>` (e.g., `issue-123-fix-login`).
- From your app-specific worktree/clone: `git checkout -b issue-123-fix-login`.
- Keep changes scoped to the app you are responsible for.

## 4) Local testing
- **Backend Node:** `npm ci && npm run dev` or `npm run start` depending on app; ensure ports from each service’s config.
- **Backend Python (be4-vjbus):** activate venv, `pip install -r requirements.txt`, then `python server.py`.
- **Frontend:** `npm ci && npm run dev` for local hot-reload; use `npm run build && npm run preview` for a production-like check.
- Run lint/tests if available (e.g., `npm test`, `npm run lint`). Add tests for new behavior when possible.

## 5) Commit and push
- Stage only the app-specific files you changed. Avoid sweeping repo-wide pulls from another app’s worktree.
- Commit message format: `Issue #<id>: <short summary>` (e.g., `Issue #123: Fix auth cookie domain`).
- Push your branch: `git push origin issue-123-fix-login` and open a PR referencing the issue.

## 6) DEV deployment
- Work from the app’s worktree/clone. Pull latest for that app only: `git pull`.
- **Frontend (DEV):** run `npm run dev` from the app directory. Do not mix multiple apps in one working tree to avoid unintended updates.
- **Backend (DEV):** run the dev/start script per service (e.g., `npm run dev`, `npm run start`, or `python server.py`).
- Perform sanity checks: key endpoints, basic flows, and authentication paths.
- Optional load sanity: use `k6` or JMeter locally against DEV URLs with a small user load (e.g., 10-20 VU for 1-2 minutes) to spot obvious regressions.

## 7) Observability (DEV)
- Application logs (DEV) in Grafana/Loki: 
  - URL: `https://observability.vjstartup.com/grafana/d/loki-logs-multi-env-v2/application-logs-multi-environment-flexible?orgId=1&from=now-24h&to=now&timezone=browser&var-datasource=ef6cjv6vg5q80d&var-environment=qa-env&var-host=$__all&var-vhost=dev-bus.vjstartup.com&var-status=$__all&refresh=10s`
  - Filter by host/vhost relevant to your service.
- Local/system logs: `journalctl -u <service>.service -n 200 -f` while reproducing.

## 8) PROD deployment (principles)
- Do not run `npm run dev` in PROD. Always build artifacts and serve them.
- Use one worktree/clone per app on the server to avoid cross-app pulls.
- Frontend deploy target under `/var/www/<app>/`. Backend via systemd services.
- Deploy by commit/tag, not by unpinned `git pull` from a shared tree. Keep a record of the deployed commit hash.

### 8a) Frontend PROD deploy (per app)
1) In the app’s worktree/clone: `git fetch`, `git checkout <tag-or-commit>`, `npm ci`, `npm run build`.
2) Copy build output to `/var/www/<app>/` (or rsync from CI artifact). Example: `rsync -a dist/ /var/www/openhouse/`.
3) Verify file perms/ownership as required by web server (nginx).
4) Smoke test via the public URL.

### 8b) Backend PROD deploy (per app)
1) In that app’s worktree/clone: `git fetch`, `git checkout <tag-or-commit>`, `npm ci` (or `pip install -r requirements.txt` for Python).
2) Restart only the target service: `sudo systemctl restart be3-openhouse.service` (replace with the correct unit).
3) Verify health endpoint (e.g., `curl -fsS http://host:port/health`).
4) Tail logs: `journalctl -u be3-openhouse.service -n 200 -f` and Grafana (production datasource below).

## 9) Observability (PROD)
- Application logs (PROD) in Grafana/Loki (bus example):
  - URL: `https://observability.vjstartup.com/grafana/d/loki-logs-multi-env-v2/application-logs-multi-environment-flexible?orgId=1&from=now-24h&to=now&timezone=browser&var-datasource=df6dbx907kxz4a&var-environment=production&var-host=$__all&var-vhost=bus.vjstartup.com&var-status=$__all&refresh=10s`
  - Adjust `var-vhost` to your app (e.g., wall, openhouse, outpass, easyfind, etc.).
- System logs: `journalctl -u <service>.service -n 200 -f`.

## 10) Rollback playbook
- Identify last known good commit/tag for the affected app.
- Frontend: redeploy the previous build artifact to `/var/www/<app>/` (keep the last build tar/zip per release). If using symlink strategy (`current` -> release dir), repoint to the previous release and reload nginx if needed.
- Backend: `git checkout <previous-good-commit>` in that app’s worktree/clone, `npm ci` if deps changed, then `sudo systemctl restart <service>.service`.
- Confirm with `/health` and a quick smoke test; monitor Grafana and `journalctl`.

## 11) Load testing (optional but recommended before major releases)
- Use JMeter or k6 from a separate machine to avoid skewing results.
- Target the relevant DEV or a staging-equivalent endpoint; avoid overloading PROD.
- Keep scenarios checked into a `tests/load` folder per app if available; parameterize base URLs and auth.

## 12) General do-nots
- Do not run `git pull` in a shared tree that multiple services use.
- Do not commit secrets (.env, keys). Use environment variables or secret managers.
- Do not run `npm run dev` in production environments.

## 13) Quick commands reference
- Restart a backend service: `sudo systemctl restart <service>.service`
- Follow logs: `journalctl -u <service>.service -n 200 -f`
- Health check: `curl -fsS http://<host>:<port>/health`

## 14) Questions
If anything is unclear or a new service is added, ask the team before proceeding to avoid cross-app impact.
