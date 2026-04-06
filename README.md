# Solar Plant Engineering Platform

Production-style full-stack geospatial platform for solar EPC/design teams to set up projects, edit plant boundaries, run automation modules, track jobs, and generate reports.

## Stack

- Frontend: Next.js 14 App Router, React 18, TypeScript, Tailwind CSS, Zustand, Axios, Leaflet, Canvas, React Hot Toast, Jest
- Backend: Flask, SQLAlchemy, GeoAlchemy2, Shapely, PostgreSQL/PostGIS, Pytest

## Monorepo Layout

- `frontend/`: Next.js app with workspace UI, map, canvas, automation drawer, reports, tests
- `backend/`: Flask API, models, services, routes, tests, seed script

## Core Features Implemented

- Authentication: register/login/me with role support (`admin`, `engineer`, `viewer`)
- Dashboard: project list, stats, recent jobs, quick navigation
- Project management: create/list/update project, revisions, default layers, audit trail
- Workspace shell:
  - top toolbar
  - left tools sidebar
  - right sidebar (boundaries + layers)
  - bottom job panel
  - center tabs: 2D Canvas, Map View, 3D Terrain placeholder, Reports
- Boundary lifecycle:
  - draw / edit / select / delete
  - save/cancel
  - backend persistence
  - reload on refresh
  - boundary list with select/focus/edit/delete
- Boundary validation:
  - min vertices
  - non-zero area
  - self-intersection rejection
  - polygon closure handling
- Layer system: visibility/lock/style metadata + default layer creation
- Geometry CRUD: create/get/list/update/delete, bulk create/delete/rename, geojson export, spatial query inside boundary
- Automation modules:
  - strict `place_tables` requiring selected boundary
  - no fallback boundary
  - table polygons created only when fully inside selected boundary
  - generic module endpoints for additional automation tracks
- Jobs: every module run creates a tracked job (`pending/running/done/failed` pattern)
- Reports: summary + BOQ + GeoJSON endpoints + frontend report cards/export
- Terrain: upload/list endpoints and isolated 3D placeholder view

## Coordinate/CRS Behavior

- Geometry is stored in EPSG:4326 (WGS84) in backend.
- Project has configurable design CRS metadata (e.g. `EPSG:32644`).
- Frontend map and canvas use shared WGS84 geometry utilities for consistent rendering.
- Metric/projection-heavy calculations are isolated to service layers (not ad-hoc in UI).

## Local Setup

## 1) Infrastructure (PostgreSQL + PostGIS)

Use local DB or Docker. Example Docker:

```bash
docker run --name solar-postgis -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=solar_platform -p 5432:5432 -d postgis/postgis:16-3.4
```

Create test DB:

```bash
createdb -h localhost -U postgres solar_platform_test
```

## 2) Backend

```bash
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
python manage.py
python scripts/seed.py
python run.py
```

Backend runs at `http://localhost:5000`.

## 3) Frontend

```bash
cd frontend
npm install
copy .env.example .env.local
npm run dev
```

Frontend runs at `http://localhost:3000`.

## Seed Credentials

- Email: `admin@sungrid.local`
- Password: `password123`

## Test Commands

## Backend

```bash
cd backend
pytest
```

## Frontend

```bash
cd frontend
npm test
```

## API Surface Summary

- Auth: `/api/auth/register`, `/api/auth/login`, `/api/auth/me`
- Projects/Revisions/Audit: `/api/projects`, `/api/projects/:id/revisions`, `/api/projects/:id/audit`
- Layers: `/api/layers`
- Geometry:
  - `/api/geometry/features`
  - `/api/geometry/features/bulk`
  - `/api/geometry/features/bulk-delete`
  - `/api/geometry/features/bulk-rename`
  - `/api/geometry/export/geojson`
  - `/api/geometry/spatial-query/inside-boundary`
- Modules/Jobs: `/api/modules/*`, `/api/jobs`
- Terrain: `/api/terrain`
- Reports: `/api/reports`, `/api/reports/summary`, `/api/reports/boq`, `/api/reports/geojson`
- Help: `/api/help/modules`, `/api/help/crs`

## Notes

- This repository is structured for production extension: modular services, strict payload validation, typed frontend API clients, and reusable geometry/state utilities.
- 3D terrain and several advanced modules are scaffolded with real endpoints and job tracking, ready for deeper algorithmic implementation.

