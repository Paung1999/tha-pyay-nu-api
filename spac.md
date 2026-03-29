# 🐛 Backend Bug Report — `tha-pyay-nu-api`

> **Date:** 2026-02-23  
> **Method:** Full static code analysis of all source files + live server startup test  
> **Server startup:** ✅ Server started successfully on port 8800  
> **DB connectivity:** Requests timed out (local PostgreSQL may not be running — `.env` points to `localhost:5432`)

---

## 🔴 Critical Bugs

---

### Bug 1 — Login route is missing the leading slash

**File:** `routes/v1/user.ts` — Line 62

```ts
// ❌ WRONG — missing "/" before "login"
userRouter.post("login", async(req, res) => {
```

```ts
// ✅ CORRECT
userRouter.post("/login", async(req, res) => {
```

**Impact:** The `/api/v1/user/login` endpoint is **completely unreachable** (404 for all requests). This is a showstopper — no user can log in.

---

### Bug 2 — JWT secret environment variable name typo

**File:** `routes/v1/user.ts` — Line 94

```ts
// ❌ WRONG — "JWT_SRCRET" (typo: S-R-C-R-E-T)
}, process.env.JWT_SRCRET as string, {
```

```ts
// ✅ CORRECT — should match .env key "JWT_SECRET"
}, process.env.JWT_SECRET as string, {
```

**Impact:** Even if the login route were reachable, `process.env.JWT_SRCRET` is `undefined`. The JWT is signed with `undefined` as the secret, which means:
- The token is **cryptographically invalid** — `jsonwebtoken` will silently sign with `"undefined"` string.
- Any subsequent `jwt.verify()` call using the correct `JWT_SECRET` will **reject** all tokens.
- All protected routes (via `auth` middleware) will **always return 401 Unauthorized**.

---

### Bug 3 — `checkRole` middleware runs without `auth` on admin routes

**File:** `app.ts` — Lines 18–19

```ts
// ❌ WRONG — checkRole checks res.locals.user but auth() was never run to SET it
app.use("/api/v1/admin", checkRole("ADMIN"), adminRouter);
app.use("/api/v1/admin/sellBook", checkRole("ADMIN"), sellBookRouter);
```

```ts
// ✅ CORRECT — auth must run first to populate res.locals.user
app.use("/api/v1/admin", auth, checkRole("ADMIN"), adminRouter);
app.use("/api/v1/admin/sellBook", auth, checkRole("ADMIN"), sellBookRouter);
```

**Impact:** `checkRole` reads `res.locals.user`, but since `auth` middleware never runs, `res.locals.user` is always `undefined`. This means:
- Anyone without a token gets **403 Forbidden** (correct behavior, wrong reason).
- **A legitimate admin with a valid token also gets 403** because `auth` never decodes their token into `res.locals.user`.
- All admin endpoints are permanently locked out.

> **Note:** `adminRouter.ts` also imports `auth` (line 2) but never actually uses it on any route — it's a dead import.

---

### Bug 4 — Sell book route is shadowed / unreachable

**File:** `app.ts` — Lines 18–19

```ts
app.use("/api/v1/admin", checkRole("ADMIN"), adminRouter);
app.use("/api/v1/admin/sellBook", checkRole("ADMIN"), sellBookRouter);  // ❌ shadowed
```

**Impact:** Express matches routes in order. Because `/api/v1/admin` is mounted first, any request to `/api/v1/admin/sellBook/...` will be matched and handled by `adminRouter` (which has a `/:id` catch-all), **never reaching `sellBookRouter`**. The `sellBook` router is effectively unreachable.

**Fix:** Mount `sellBook` before the generic admin route, or use a unique prefix like `/api/v1/admin/sell-books`.

---

## 🟠 Medium Bugs

---

### Bug 5 — `genres.ts` PUT endpoint does not validate or 404 on missing genre

**File:** `routes/v1/admin/genres.ts` — Lines 60–84

```ts
const genre = await prisma.genre.findUnique({ where: {id: Number(id)} });
// ❌ genre is fetched but NEVER CHECKED — no "if (!genre)" guard
const updatedGenre = await prisma.genre.update({ ... });
```

**Impact:** If the genre doesn't exist, `prisma.genre.update()` throws a Prisma `P2025` error ("Record to update not found"), which falls into the generic 500 handler instead of returning a proper **404 Not Found**. The fetched `genre` variable is completely unused.

---

### Bug 6 — `genres.ts` DELETE endpoint does not check existence before deleting

**File:** `routes/v1/admin/genres.ts` — Lines 86–105

```ts
// ❌ No existence check before deleting
await prisma.genre.delete({ where: {id: Number(id)} });
```

**Impact:** If the genre ID doesn't exist, Prisma throws `P2025`, resulting in a **500 Internal Server Error** instead of a clean **404 Not Found**.

---

### Bug 7 — Prisma schema missing `url` in datasource

**File:** `prisma/schema.prisma` — Lines 12–14

```prisma
datasource db {
  provider = "postgresql"
  // ❌ Missing: url = env("DATABASE_URL")
}
```

**Impact:** The schema has no `url` field. While your `lib/prisma.ts` provides the connection string via the `PrismaPg` adapter (bypassing the schema's url), this means `prisma migrate` and `prisma db push` CLI commands will **fail** unless `prisma.config.ts` (which provides the url override) is consistently used. It is a fragile setup.

---

### Bug 8 — Password returned in login response

**File:** `routes/v1/user.ts` — Lines 76–98

```ts
// The user object returned in the response INCLUDES the hashed password
return res.json({ user, token })
```

**Impact:** The `select` block in the `findUnique` call fetches `password: true`, and then the entire `user` object (including the hashed password) is returned to the client. This is a **security risk**. The password field should be excluded from the response.

---

### Bug 9 — No input validation on `register` route (missing fields not checked)

**File:** `routes/v1/user.ts` — Lines 26–60

```ts
// ❌ name, email, password are used directly with no "if (!name || !email || !password)" guard
const name = req.body?.name;
const email = req.body?.email;
const password = req.body?.password;
```

**Impact:** If `name`, `email`, or `password` are missing from the request body, Prisma will throw a validation error (non-null constraint), resulting in a **500 Internal Server Error** instead of a proper **400 Bad Request** with a descriptive message.

---

## 🟡 Minor Issues

---

### Issue 10 — `adminRouter.ts` imports `auth` but never uses it

**File:** `routes/v1/admin/adminRouter.ts` — Line 2

```ts
import { auth } from "../../../middlewares/auth";  // unused import
```

This is a dead import. It was probably intended to be used (see Bug 3).

---

### Issue 11 — `sellBook.ts` PUT does not update `isActive` correctly

**File:** `routes/v1/admin/sellBook.ts` — Line 111

```ts
data: {
    ...
    isActive: true  // ❌ hardcoded — always reactivates the listing on any update
}
```

The `isActive` field is always set to `true` on every PUT, ignoring any deactivation intent. The client should be able to pass `isActive` in the body.

---

### Issue 12 — No `Content-Type` or request size validation

**File:** `app.ts`

There is no validation that incoming requests have `Content-Type: application/json`. Sending malformed JSON bodies can result in unhandled parse errors depending on the Express version.

---

## Summary Table

| # | Severity | File | Issue |
|---|----------|------|-------|
| 1 | 🔴 Critical | `routes/v1/user.ts:62` | Login route missing `/` prefix — 404 always |
| 2 | 🔴 Critical | `routes/v1/user.ts:94` | `JWT_SRCRET` typo → tokens signed with `undefined` |
| 3 | 🔴 Critical | `app.ts:18-19` | `auth` missing before `checkRole` — admins always get 403 |
| 4 | 🔴 Critical | `app.ts:19` | `sellBook` router shadowed by `/admin` — unreachable |
| 5 | 🟠 Medium | `routes/v1/admin/genres.ts:70` | PUT missing 404 guard — 500 on missing genre |
| 6 | 🟠 Medium | `routes/v1/admin/genres.ts:93` | DELETE missing existence check — 500 on missing genre |
| 7 | 🟠 Medium | `prisma/schema.prisma:12` | `datasource` missing `url` field |
| 8 | 🟠 Medium | `routes/v1/user.ts:98` | Hashed password leaked in login response |
| 9 | 🟠 Medium | `routes/v1/user.ts:26` | Register missing input validation — 500 on missing fields |
| 10 | 🟡 Minor | `routes/v1/admin/adminRouter.ts:2` | Unused `auth` import |
| 11 | 🟡 Minor | `routes/v1/admin/sellBook.ts:111` | `isActive` hardcoded to `true` on update |
| 12 | 🟡 Minor | `app.ts` | No Content-Type or bad JSON error handling |
