# 📋 PLAN — T-101 step 19: `DriverBalans` + `DriverDaromad` → the wallet screens

> Split out of `docs/PLAN.md` on **2026-09-12**, the way steps 16, 17 and 18 were: measured
> before the card was believed. The parent card in `PLAN.md` stays unchecked and points here.
>
> 🛑 **NO CODE UNTIL THE OWNER ANSWERS §3.** This is the first step of T-101 where the honest
> recommendation is **"build half of it, and not the half the card assumed"**.

---

## 1. What this actually is

| | |
|---|---|
| artboards | `htmlDesign/DriverBalans.dc.html` (**588 lines**) and `DriverDaromad.dc.html` (**484**) |
| card said | "No such screens exist in the driver app today — these are new, and they touch T-087's ledger. Confirm scope with the owner; may belong in its own card." |
| measured | **The card was right that they are new, and WRONG that they are blocked.** T-087's ledger is **built, mounted and live** — and has never had a single consumer. |

🟢 **THE BACKEND EXISTS** (verified 2026-09-12, not assumed):

- `GET /api/wallet/balances` → `{ real, token, bonus }` (`WalletController.getBalances`)
- `GET /api/wallet/:kind/statement?from&to&limit&offset` → `{ rows, count }`, newest first,
  limit capped at 200
- `routes/index.ts:109` mounts them. `WalletAccount` = one row per `(user, kind)` with a
  `balance`; `WalletTransaction` = an append-only ledger with `amount`, `balance_after`,
  `reason`, `actor_type`, `provider`, `external_id`, `reverses_id`, `meta`, `created_at`.
- ⚠️ **The driver app has NO wallet API client** (`api/` has no `wallet.ts`) — that is the gap,
  not the server.

🔴 **AND THE THREE TOP-LEVEL GROUPS LINE UP EXACTLY.** The artboard's `Pul · Token · Bonus`
are the model's `real · token · bonus`. That is the good news, and it is where it stops.

---

## 2. 🔴 The finding that decides this step

**`DriverDaromad` has no data source. Not a thin one — none.**

The ledger's complete reason set is:

```
paynet_topup · admin_topup · referral_user · referral_driver · bonus_signup ·
bonus_admin · bonus_promo · bonus_expired · ride_discount · reversal · correction
```

**There is no `ride_earning`, no `trip_payout`, no driver credit of any kind.** The only
ride-shaped reason is `ride_discount` — money *spent on* a ride. `provider` is
`'paynet' | 'payme' | 'click'`, i.e. ways money comes **in**.

So this ledger is a **top-up-and-spend wallet**, and **a driver is never paid through it.**
A seat is settled in cash between two people; `total_agreed_price` on a booking is what a
passenger *agreed to pay*, and nothing records that it happened.

**Consequences, and they are not small:**

1. **`DriverDaromad` (income) cannot be built at all.** Period income, the fee split, the
   per-source breakdown, per-trip gross-vs-fee rows, and the `Dispetcher` / `Logist` agent
   commissions all need records that do not exist. There is **no commission or fee model
   anywhere** in the API (grep of `database/models/`: nothing).
2. **`DriverBalans` CAN be built, but it does not mean what a driver will assume.** It will
   truthfully show top-ups, referrals and bonuses. A driver opening "Balans" expecting to see
   what they earned this week will find none of it — because the system has never known.
3. **The artboard's sub-accounts do not exist.** `WalletAccount` is **one row per kind**. The
   artboard draws 4 money sub-accounts, 5 token sub-accounts and 3+ bonus sub-accounts, each
   with its own balance, and bonus accounts additionally carry **expiry dates and burn rules**
   (`expiry`, `burn`). There is no `expires_at` column and no sub-account table.

⚠️ **`bonus_expired` exists as a REASON, so expiry is intended** — something is expected to
write that entry. Nothing does yet, and nothing stores when it would fire.

---

## 3. 🛑 Owner decisions — needed before any code

| # | question | recommendation |
|---|---|---|
| ① | **`DriverDaromad` (income) has no data source.** Build nothing, or fabricate? | **Build nothing. Move the whole income screen to its own backend card (T-111).** It needs a driver-earnings ledger entry per completed ride plus a commission model — that is a billing design decision with money attached, not a screen. Fabricating it would be the largest fabricated-state violation in this project. |
| ② | **`DriverBalans` — build the reduced but REAL version?** Three account cards (`Pul · Token · Bonus`) from `/wallet/balances`, each opening its own statement from `/wallet/:kind/statement`, paginated. No sub-accounts, no expiry, no top-up button, no token transfer, no referral lock. | **Yes.** It is fully backed, it is T-087's first consumer, and it is the only part of this step that can be true. ⚠️ It must not be labelled in a way that promises earnings — see ③. |
| ③ | **What does the screen call itself,** given it cannot show earnings? | **"Hisob" / "Balans" only, with no income framing**, and the bottom-bar tab that step 3 left out stays out until ① lands. A driver must not open a tab called *Daromad* and see a number that is not their income. |
| ④ | **Sub-accounts, bonus expiry, top-up, token transfer, the referral lock.** | **Not built; boarded with ① as T-111.** Each needs schema: a sub-account table, an `expires_at` + the job that writes `bonus_expired`, a top-up flow (that is T-088/Paynet), and a transfer endpoint. |
| ⑤ | **Is this T-101's card at all?** It is the only step that builds a screen from nothing rather than rebuilding one. | **Build ② inside T-101** (it is small and it is the design system's job to draw it), **and let T-111 carry everything else.** The alternative — parking step 19 whole — leaves T-087's ledger with zero consumers indefinitely. |

---

## 4. Steps (only if ② is approved)

- [ ] **19a.** `api/wallet.ts` in the driver app — `getBalances`, `getStatement(kind, opts)`,
      typed to the real controller shapes. ⚠️ `amount` and `balance_after` are **BIGINT read as
      strings**; one coercion point, as in 18a.
- [ ] **19b.** `utils/wallet.ts` (pure) + `scripts/check-wallet.mjs` — kind ordering and labels,
      sign/tone of an entry, reason → label key (all 11), statement grouping by day, paging
      state. Proven red by mutation.
- [ ] **19c.** `AccountCard` + `StatementRow` in `components/wallet/`, measured from
      `DriverBalans` lines 346+. Contrast measured from the bundled palette before committing.
- [ ] **19d.** `WalletScreen` — three account cards, one expanding to its statement with
      pagination and pull-to-refresh; empty state for an account with no entries.
- [ ] **19e.** Route it from the drawer (`Balans`), **not** a new bottom tab (③). Keep
      `check-drawer.mjs` green.
- [ ] **19f.** Checkers, baselines, board: i18n sweep extended and proven red; **T-111 boarded**
      with ① and ④; journal.

---

## 5. Baselines — never rebaseline upward

Driver `tsc` **28** · lint **0 / 275** · tokens **3** · the nine checkers · `expo export`.

---

## 6. Session notes

### 2026-09-12 — measured; the blocker is the opposite of the one the card named

The card feared the ledger was missing. It is built, mounted and live, and the three artboard
groups map exactly onto its three account kinds. **The real blocker is one level deeper: the
ledger has no reason code by which a driver is ever paid**, so the income screen has no data
source and the balance screen cannot mean what its reader will assume. Recommendation: build
the honest half, board the rest as T-111. **No code written.**
