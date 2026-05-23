# API Reference

> ForgeOps REST API — complete endpoint reference.  
> Base URL: `http://localhost:4000/api`  
> Swagger UI: `http://localhost:4000/api/docs`

## Authentication

All authenticated endpoints require a valid `forgeops_access_token` httpOnly cookie. Obtain one via `/auth/login` or `/auth/register`.

For workspace-scoped endpoints, include the `x-workspace-slug` header to resolve workspace context.

| Header | Type | Required | Description |
|---|---|---|---|
| `x-workspace-slug` | string | For workspace-scoped endpoints | Workspace slug to scope the request |
| `Cookie` | string | For authenticated endpoints | `forgeops_access_token=<jwt>` (set by login/register) |

---

## Auth

### POST /auth/register

Create a new user account and personal workspace. Auto-seeds DEV, STAGING, and PROD environments.

**Public** — no auth required.

**Request body:**
```json
{
  "email": "alice@example.com",
  "name": "Alice Nguyen",
  "password": "secureP@ss123"
}
```

| Field | Type | Constraints |
|---|---|---|
| `email` | string | Valid email, unique |
| `name` | string | Min 1 character |
| `password` | string | Min 8 characters |

**Response (201):**
```json
{
  "id": "clxyz...",
  "email": "alice@example.com",
  "name": "Alice Nguyen",
  "avatarUrl": null,
  "createdAt": "2026-05-23T10:00:00.000Z",
  "memberships": [
    {
      "workspaceId": "clabc...",
      "workspaceSlug": "alice",
      "workspaceName": "alice's Workspace",
      "role": "ADMIN"
    }
  ]
}
```

**Cookies set:** `forgeops_access_token` (15m), `forgeops_refresh_token` (30d)

**Errors:** `409` — Email already registered

---

### POST /auth/login

Authenticate with email and password.

**Public** — no auth required.

**Request body:**
```json
{
  "email": "alice@example.com",
  "password": "secureP@ss123"
}
```

**Response (200):** Same shape as register response.

**Cookies set:** `forgeops_access_token` (15m), `forgeops_refresh_token` (30d)

**Errors:** `401` — Invalid credentials

---

### POST /auth/refresh

Rotate the access token using the refresh cookie.

**Public** — requires `forgeops_refresh_token` cookie.

**Response (200):**
```json
{
  "id": "clxyz...",
  "email": "alice@example.com",
  "name": "Alice Nguyen",
  "avatarUrl": null,
  "createdAt": "2026-05-23T10:00:00.000Z",
  "memberships": [...]
}
```

**Cookies set:** New `forgeops_access_token` and `forgeops_refresh_token`

**Errors:** `401` — No refresh token / Invalid refresh token

---

### POST /auth/logout

Clear auth cookies.

**Authenticated.**

**Response (200):**
```json
{ "message": "Logged out" }
```

---

### GET /auth/me

Get the current authenticated user with workspace memberships.

**Authenticated.**

**Response (200):**
```json
{
  "id": "clxyz...",
  "email": "alice@forgeops.dev",
  "name": "Alice Nguyen",
  "avatarUrl": null,
  "createdAt": "2026-05-23T10:00:00.000Z",
  "memberships": [
    {
      "workspaceId": "clabc...",
      "workspaceSlug": "acme-platform",
      "workspaceName": "Acme Platform",
      "role": "ADMIN"
    }
  ]
}
```

---

## Users

### GET /users/me

Get current user profile.

**Authenticated.**

**Response (200):**
```json
{
  "id": "clxyz...",
  "email": "alice@forgeops.dev",
  "name": "Alice Nguyen",
  "avatarUrl": null,
  "createdAt": "2026-05-23T10:00:00.000Z"
}
```

---

### PATCH /users/me

Update current user profile.

**Authenticated.**

**Request body:**
```json
{
  "name": "Alice N.",
  "avatarUrl": "https://example.com/avatar.jpg"
}
```

| Field | Type | Optional |
|---|---|---|
| `name` | string | Yes |
| `avatarUrl` | string | Yes |

**Response (200):** Updated user object (same shape as GET).

---

## Workspaces

### POST /workspaces

Create a new workspace. Auto-seeds DEV, STAGING, and PROD environments. Creator becomes ADMIN.

**Authenticated.**

**Request body:**
```json
{
  "slug": "my-team",
  "name": "My Team",
  "description": "Team workspace for Project X"
}
```

| Field | Type | Constraints |
|---|---|---|
| `slug` | string | Unique, URL-safe |
| `name` | string | Required |
| `description` | string | Optional |

**Response (201):**
```json
{
  "id": "clabc...",
  "slug": "my-team",
  "name": "My Team",
  "description": "Team workspace for Project X",
  "environments": [
    { "kind": "DEV", "name": "Development", "protected": false },
    { "kind": "STAGING", "name": "Staging", "protected": false },
    { "kind": "PROD", "name": "Production", "protected": true }
  ]
}
```

**Errors:** `403` — Slug already taken

---

### GET /workspaces

List workspaces the current user belongs to.

**Authenticated.**

**Response (200):**
```json
[
  {
    "id": "clabc...",
    "slug": "acme-platform",
    "name": "Acme Platform",
    "description": "Main product platform team workspace",
    "createdAt": "2026-05-23T10:00:00.000Z",
    "role": "ADMIN",
    "memberCount": 3,
    "serviceCount": 5
  }
]
```

---

### GET /workspaces/:slug

Get workspace detail by slug. Returns environments, members, and service count.

**Authenticated.** Requires membership.

**Response (200):**
```json
{
  "id": "clabc...",
  "slug": "acme-platform",
  "name": "Acme Platform",
  "description": "Main product platform team workspace",
  "createdAt": "2026-05-23T10:00:00.000Z",
  "role": "ADMIN",
  "environments": [...],
  "memberships": [
    {
      "userId": "clxyz...",
      "role": "ADMIN",
      "user": { "id": "clxyz...", "email": "alice@forgeops.dev", "name": "Alice Nguyen" }
    }
  ],
  "_count": { "services": 5 }
}
```

**Errors:** `403` — Not a member, `404` — Workspace not found

---

### POST /workspaces/:slug/members

Invite a member by email. **ADMIN only.**

**Request body:**
```json
{
  "email": "bob@forgeops.dev",
  "role": "DEVELOPER"
}
```

| Field | Type | Values |
|---|---|---|
| `email` | string | Must be an existing user |
| `role` | enum | `ADMIN`, `DEVELOPER`, `VIEWER` |

**Response (201):** Membership object with user details.

**Errors:** `403` — Requires ADMIN role, `404` — User not found, `409` — Already a member

---

### PATCH /workspaces/:slug/members/:userId

Change a member's role. **ADMIN only.** Cannot demote the last ADMIN.

**Request body:**
```json
{
  "role": "VIEWER"
}
```

**Response (200):** Updated membership object.

**Errors:** `403` — Cannot remove the last admin, `404` — Membership not found

---

### DELETE /workspaces/:slug/members/:userId

Remove a member from the workspace. **ADMIN only.** Cannot remove yourself.

**Response (200):**
```json
{ "message": "Member removed" }
```

**Errors:** `403` — Cannot remove yourself, `404` — Membership not found

---

### GET /workspaces/:id/environments

List platform-managed environments for a workspace.

**Authenticated.** Requires membership.

**Response (200):**
```json
[
  { "id": "clenv1...", "kind": "DEV", "name": "Development", "protected": false },
  { "id": "clenv2...", "kind": "STAGING", "name": "Staging", "protected": false },
  { "id": "clenv3...", "kind": "PROD", "name": "Production", "protected": true }
]
```

---

## Audit

### GET /audit

List audit events for the current workspace. Requires `x-workspace-slug` header.

**Authenticated.** Workspace-scoped.

**Query parameters:**

| Param | Type | Default | Description |
|---|---|---|---|
| `limit` | number | 50 | Max results |
| `offset` | number | 0 | Pagination offset |

**Response (200):**
```json
{
  "items": [
    {
      "id": "claudit...",
      "workspaceId": "clabc...",
      "actorId": "clxyz...",
      "action": "SERVICE_CREATED",
      "subjectKind": "service",
      "subjectId": "clsvc...",
      "metadata": { "name": "acme-api" },
      "ipAddress": "127.0.0.1",
      "userAgent": "Mozilla/5.0...",
      "createdAt": "2026-05-23T10:00:00.000Z"
    }
  ],
  "total": 42,
  "limit": 50,
  "offset": 0
}
```

### Audit Actions

| Action | Description |
|---|---|
| `WORKSPACE_CREATED` | New workspace created |
| `USER_LOGGED_IN` | User authenticated |
| `SERVICE_CREATED` | New service registered |
| `DEPLOYMENT_TRIGGERED` | Rollout initiated |
| `ROLLOUT_SUCCEEDED` | Rollout completed successfully |
| `ROLLOUT_FAILED` | Rollout failed |
| `SCAN_PASSED` | Security scan passed |
| `SCAN_FAILED` | Security scan found critical/high issues |
| `MEMBER_INVITED` | New member added to workspace |
| `MEMBER_ROLE_CHANGED` | Member role updated |
| `MEMBER_REMOVED` | Member removed from workspace |

---

## Feature Flags

### GET /feature-flags

Get current runtime feature flags.

**Public.**

**Response (200):**
```json
{
  "aiCopilot": false
}
```

---

## Health

### GET /healthz

Liveness probe.

**Public.**

**Response (200):**
```json
{ "status": "ok" }
```

---

### GET /readyz

Readiness probe. Checks database connectivity.

**Public.**

**Response (200):**
```json
{ "status": "ok", "database": "connected" }
```

---

## Roles & Permissions

| Permission | ADMIN | DEVELOPER | VIEWER |
|---|---|---|---|
| View workspace/services | Yes | Yes | Yes |
| Create services | Yes | Yes | No |
| Trigger deployments | Yes | Yes | No |
| Manage members | Yes | No | No |
| Change settings | Yes | No | No |
| View audit log | Yes | Yes | Yes |
