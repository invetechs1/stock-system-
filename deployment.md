# Deployment guide

How to build this project into Docker images and ship it to a remote Docker
host as a self-contained tarball, replacing only this project's own
container/images on that host.

This project builds to **two images** (`server` + `client`, same pair
`docker-compose.yml` already builds for local dev) that are versioned
together under one project name so they can be swapped out as a unit:

| Thing            | Name                                  |
| ----------------- | -------------------------------------- |
| Server image       | `bassir-stock-system-server:latest`   |
| Client image        | `bassir-stock-system-client:latest`  |
| Containers          | `bassir-stock-system-server` / `bassir-stock-system-client` |
| Remote folder        | `~/bassir-stock-system/`            |
| Tarball                 | `bassir-stock-system.tar`        |

Every command below only ever touches names with the `bassir-stock-system-`
prefix — nothing else on a shared Docker host is affected.

## 1. Build fresh images locally

From the repo root:

```bash
# Remove any previous local build of this project's images (ignore errors if none exist)
docker rmi -f bassir-stock-system-server:latest bassir-stock-system-client:latest

# Build both, targeting linux/amd64 (adjust if your remote host is a different arch)
docker build --platform linux/amd64 -t bassir-stock-system-server:latest ./server
docker build --platform linux/amd64 -t bassir-stock-system-client:latest ./client
```

## 2. Package into a single tarball

```bash
docker save -o bassir-stock-system.tar \
  bassir-stock-system-server:latest \
  bassir-stock-system-client:latest
```

`docker-compose.prod.yml` (checked into the repo root) references these two
image tags directly (`image:`, not `build:`) — it's the file that runs the
images on the remote host, so it needs to travel with the tarball.

## 3. Ship it to the remote host

```bash
REMOTE=root@your.server.ip
FOLDER=~/bassir-stock-system

ssh "$REMOTE" "mkdir -p $FOLDER"
scp bassir-stock-system.tar docker-compose.prod.yml deploy.sh "$REMOTE:$FOLDER/"
```

You also need a `.env` in that same folder on the remote (it is **not**
committed to git — it holds `JWT_SECRET` and, if the default port collides
with something else already running on that host, `WEB_PORT`):

```bash
cat <<EOF | ssh "$REMOTE" "cat > $FOLDER/.env"
JWT_SECRET=$(openssl rand -hex 32)
WEB_PORT=8085
EOF
```

Check `docker ps` on the target host first and pick a `WEB_PORT` that isn't
already published by another project.

## 4. `deploy.sh` (lives in the remote project folder)

```bash
#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"

# Stop this project's containers only (leave every other project's containers alone)
docker compose -f docker-compose.prod.yml down 2>/dev/null || true

# Remove this project's old images only, by exact tag
docker rmi -f bassir-stock-system-server:latest bassir-stock-system-client:latest 2>/dev/null || true

# Load the freshly-built images from the tarball
docker load -i bassir-stock-system.tar

# Start the new containers
docker compose -f docker-compose.prod.yml up -d
```

## 5. Deploy / redeploy

Every time you want to ship a new build, repeat steps 1–3 (the tarball gets
overwritten locally and re-uploaded), then on the remote host:

```bash
ssh "$REMOTE" "cd $FOLDER && chmod +x deploy.sh && ./deploy.sh"
```

`deploy.sh` is idempotent: it tears down and removes only this project's own
containers/images before loading and starting the new ones, so it's safe to
re-run for every future deploy without affecting any other project on the
same Docker host.

## 6. Verify

```bash
ssh "$REMOTE" "docker ps --filter name=bassir-stock-system"
curl http://your.server.ip:8085/api/health
```

## Notes

- `docker-compose.prod.yml` reuses the same environment-variable contract as
  local dev (`.env.example`): `JWT_SECRET` (required), `JWT_EXPIRES_IN`,
  `TICK_MS`, `SNAPSHOT_MS`, `STARTING_CASH`, `CORS_ORIGIN`, `WEB_PORT`.
- The SQLite database persists in the `stock-data` named Docker volume, so
  re-running `deploy.sh` (which only removes containers/images, never
  volumes) does not lose data.
- The client's nginx config proxies `/api` and `/ws` to a host named
  `server` — that only resolves because `docker-compose.prod.yml` runs both
  containers on the same compose-managed network. Don't replace the compose
  file with standalone `docker run` commands unless you also recreate that
  network alias.
