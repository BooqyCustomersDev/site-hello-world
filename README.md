# Restaurant site

One restaurant's own website, built on [`@bookingsystemadvancedorg/site-kit`](https://github.com/BookingSystemAdvancedOrg/site-kit)
(booking, menu, ordering and payment, catering, GDPR pages). This repo holds
only the look: layout, pages and styles. Designed in Figma by Booqy, coded on
top of the kit.

This is `site-template` in the GitHub organisation `BooqyCustomers`. Booqy
creates a public copy `site-<slug>` from it for every restaurant, in one of
two organisations:

- **BooqyCustomers**: real customers, created in the production console.
  `dev` deploys to the dev preview, `main` to production.
- **BooqyCustomersDev**: test customers, created in the dev console. Both
  branches deploy to Booqy's test sandbox (never indexed): `main` to
  `https://<slug>.test.booqy.se`, `dev` to `https://<slug>.test-dev.booqy.se`.

Booqy gives a developer write access to that one repo (an invitation on
GitHub); developers are never members of either organisation. Runbook:
`infrastructure/docs/CUSTOMER-SITE-RUNBOOK.md`.

## Get started locally

Once per machine: a GitHub token with `read:packages` for the kit (the
package `site-kit` is public in BookingSystemAdvancedOrg, but GitHub Packages
still asks for a token;
`npm login --scope=@bookingsystemadvancedorg --auth-type=legacy --registry=https://npm.pkg.github.com`,
username = your GitHub user, password = the token).

```bash
git clone git@github.com:BooqyCustomers/site-<slug>.git   # a test customer: BooqyCustomersDev
cd site-<slug>
npm install
npm run dev        # http://localhost:7071, the restaurant's dev data
```

`booqy.json` says which restaurant and API each environment uses (written by
Booqy; nothing in it is secret). `npm run dev` uses its `dev` part. To point
elsewhere, copy `.env.example` to `.env.local`.

## Branches and deploys

- Work on `dev`. Every push to `dev` deploys to the dev preview
  `https://<slug>.dev.booqy.se` (never indexed by search engines).
- Go live: PR `dev` -> `main`, merge. Every push to `main` deploys to
  production, live on `https://<slug>.booqy.se` (and the restaurant's own
  domain once it is attached in Booqy; never required). The production
  deploy needs only the restaurant to be active in Booqy.
- Both deploys run in GitHub Actions (`Deploy`) and sign in to AWS with
  OIDC: no keys in the repo. Booqy writes the `DEV_*` and `PROD_*` repo
  variables when the customer is created; until then the deploy is skipped.
- A test customer's repo (BooqyCustomersDev) works the same way, but `main`
  deploys to `https://<slug>.test.booqy.se` with the `SANDBOX_MAIN_*`
  variables and `dev` to `https://<slug>.test-dev.booqy.se` with `DEV_*`
  (both in Booqy's dev account; `*_SITE_PREFIX` is the folder). Its
  `booqy.json` has the sections `test` (main) and `dev`.
- Rollback: Actions -> Deploy -> Run workflow on the branch, with the SHA of
  an older commit on it.
- Only `dev` and `main`; no other long-lived branches.

## The kit

Update PRs for `@bookingsystemadvancedorg/site-kit` come from Dependabot to `dev`. Patch
versions merge and deploy themselves when CI is green; minor and major wait
for a review. Put anything every site needs into the kit, not here.

```bash
npm test
npm run lint
npm run build      # BOOQY_ENV=prod (production) or BOOQY_ENV=test (a test customer's main)
```
