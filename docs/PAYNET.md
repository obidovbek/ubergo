# 🔌 PAYNET — the integration contract (reference)

> Extracted from the owner's two documents in `paynet/`:
> `universal_tech_doc_v_1_5.docx` (the commercial/technical annex, attached to the signed contract)
> and `UWS_JSON.pdf` (the JSON-RPC protocol spec).
>
> ✅ **REWRITTEN 2026-08-16 FROM COMPLETE EXTRACTIONS OF BOTH FILES.**
> 🔴 **The 2026-08-14 header of this file claimed neither document could be read. THAT WAS WRONG,
> and it cost four questions being put to Paynet that the documents already answered.** Both extract
> completely, in seconds, with tools that are installed:
> - **PDF:** `pdftotext -enc UTF-8 -layout UWS_JSON.pdf out.txt` → **7 196 Cyrillic characters**,
>   clean. (The earlier attempt omitted `-enc UTF-8` and blamed the font.)
> - **DOCX:** it is a **zip of XML** — `zipfile` + strip tags. **No library needed at all.**
> - ⚠️ On this machine the console is cp1252, so **write extractions to a UTF-8 FILE and read that**;
>   printing Cyrillic to stdout throws `UnicodeEncodeError` and looks like a corrupt document.
>
> **Verify against the originals before implementing anything load-bearing** — the tables below are
> transcribed, and the PDF's table extraction misaligns rows by one where a cell wraps.

## 1. The single most important fact

🔴 **PAYNET CALLS US. WE DO NOT CALL PAYNET.**
UbexGo is the *Поставщик* (Provider). We must **stand up a JSON-RPC 2.0 web service** that Paynet's
terminals call when a customer hands cash to a Paynet agent. There is no outbound "charge a card"
API here at all.

⚠️ **This is the opposite of how T-088 was originally written**, which assumed we call a provider to
collect money. Payme and Click are separate integrations with their own (different) contracts —
**nothing in these two documents covers them.**

## 2. Transport and access

| | |
|---|---|
| Protocol | **JSON-RPC 2.0** over HTTPS (SOAP 1.1/1.2 also allowed — pick JSON-RPC) |
| Auth | HTTP username/password. Sample doc shows `Username: paynet`, password over a secure channel |
| Source IPs | **`213.230.106.112/28` and `213.230.65.80/28` ONLY** |
| Network | Provider must connect only from **TAS-IX** |
| Response time | **≤ 500 ms**, exceptionally ≤ 1 s (max 30 min/day). 30 s = connection dropped |
| Penalty | Exceeding the time budget → **UZPAYNET may disconnect the provider** |

🔴 **The IP allow-list is a contractual obligation, not a suggestion.** The document states the
provider **must** refuse other IPs and **must not accept payments** that arrive in violation of it.

🔴 **THE SAMPLE DOCUMENT IS FILLED IN FOR A DIFFERENT COMPANY.** Table 1 names **"TV Turon Navoi"**
with the URL `https://navpay.tn.uz/paynet/api/webservice`. **UbexGo has no `serviceId`, no URL, no
username and no password yet** — those come from Paynet when the contract is signed.
⚠️ **Do not hard-code anything from that table.** Env only (rule 5).

## 3. The six methods — all mandatory

| Method | Purpose |
|---|---|
| `PerformTransaction` | Take a payment into the provider's account |
| `CheckTransaction` | Report the state of a payment |
| `CancelTransaction` | Reverse a payment |
| `GetStatement` | Return all transactions in a date range (daily reconciliation) |
| `GetInformation` | Look up a payer — **this is what the agent sees before taking the cash** |
| `ChangePassword` | Rotate the web-service password |

⚠️ **If `ChangePassword` exists, Paynet is obliged to rotate the password on first successful
connection.** So it must work from day one, and the password must live somewhere rotatable — **not
in a config file baked into an image.**

## 4. Envelope

```jsonc
// request
{ "jsonrpc": "2.0", "method": "methodname", "id": 123, "params": { /* body */ } }

// success
{ "jsonrpc": "2.0", "id": 123, "result": { /* body */ } }

// failure
{ "jsonrpc": "2.0", "id": 1, "error": { "code": -253, "message": "Error message!" } }
```

✅ **SIGN RESOLVED 2026-08-16 — POSITIVE, and the two documents were never in conflict.**
The JSON spec §2.5 lists **two ranges with different jobs**:
- **Negative** `-32300 · -32700 · -32600 · -32601 · -32602 · -32603` — these are **JSON-RPC 2.0's
  own standard protocol errors** (not POST, parse error, method not found, bad params, internal).
  Identical in every JSON-RPC implementation; nothing Paynet-specific about them.
- **Positive** `0 · 77 · 100 … 603` — **Paynet's business errors.**

The **`-253`** that caused the doubt is a **placeholder inside an illustrative example**, not a real
code. *A question was sent to Paynet about this before the documents were read properly; it did not
need asking.*

## 5. Payloads (verbatim from the JSON spec)

```jsonc
// GetInformation — the agent identifying the payer
{"jsonrpc":"2.0","method":"GetInformation","id":12350,
 "params":{"serviceId":1,"fields":{"client_id":634247}}}
// 🔴 THE RESPONSE IS status + timestamp + a NESTED `fields` OBJECT (spec §3.1).
// The per-service values live INSIDE `fields`; they are NOT top-level.
{"jsonrpc":"2.0","id":12350,
 "result":{"status":"0","timestamp":"2021-04-30 08:00:00",
           "fields":{"balance":420000,"name":"Пушкин А.С."}}}
// ⚠️ `{"client_id":"1463398","fio":"…"}` appears in the spec's §2.4 NARRATIVE as a
// generic illustration of "a result object". It is NOT GetInformation's shape —
// T-088 was first built against it and would have failed on Paynet's first call.

// PerformTransaction — the money
{"jsonrpc":"2.0","method":"PerformTransaction","id":12345,
 "params":{"amount":100000,"serviceId":1,"transactionId":12345678900,
           "fields":{"client_id":"634247"}}}
{"jsonrpc":"2.0","id":"12345","result":{"timestamp":"2021-06-16 12:41:54",
           "providerTrnId":2323,"fields":{"client_id":"634247"}}}

// CheckTransaction
{"jsonrpc":"2.0","method":"CheckTransaction","id":12346,
 "params":{"serviceId":1,"transactionId":12345678900,"timestamp":"2021-…"}}
{"jsonrpc":"2.0","id":"12346","result":{"transactionState":1,
           "timestamp":"2021-06-16 12:44:57","providerTrnId":2323}}

// CancelTransaction
{"jsonrpc":"2.0","method":"CancelTransaction","id":…,"params":{"serviceId":1,…}}
{"jsonrpc":"2.0","id":…,"result":{"providerTrnId":2323,"transactionState":2}}

// GetStatement — daily reconciliation
{"jsonrpc":"2.0","method":"GetStatement","id":12348,
 "params":{"serviceId":1,"dateFrom":"2021-04-20 08:00:00","dateTo":"2021-04-30 08:00:00"}}
// result: a list of transactions, each with its providerTrnId

// ChangePassword
{"jsonrpc":"2.0","method":"ChangePassword","id":12351,
 "params":{"newPassword":"newDifficultPassword"}}
```

**Identifier roles — do not mix these up:**
- **`transactionId`** — **PAYNET'S** id for the payment. **This is the idempotency key.**
- **`providerTrnId`** — **OUR** id, which we mint and return; Paynet then quotes it back in
  `CheckTransaction` / `CancelTransaction` / `GetStatement`.
- **`transactionState`** — `1` = performed, `2` = cancelled (from the samples).

## 6. 🔴 MONEY IS IN INTEGER TIYIN

The annex labels the balance field *"Баланс плательщика после проведения транзакции (**тийин**)"*
and types it **`long`**. The sample `"amount": 100000` is therefore **1 000 so'm**, not 100 000.

**Consequences:**
- The ledger should store **integer tiyin (`BIGINT`)**, not `DECIMAL` so'm. A decimal ledger against
  an integer-tiyin counterparty makes every call a ×100 conversion, and a conversion bug inside a
  payment endpoint is silent and expensive.
- ⚠️ **Ride prices stay `DECIMAL(10,2)` so'm** — they are a different concern with a different
  counterparty (a human paying a driver in a car). **The boundary between the two must be crossed in
  exactly one place**, or the two conventions will leak into each other.

## 6a. ✅ THE TWO DOCUMENTS AGREE ON THE ERROR CODES

🔴 **A conflict was reported here on 2026-08-16 and it was FALSE — an artefact of PDF extraction,
corrected the same day. Recorded because the false version was acted on.**

**What happened:** `pdftotext -layout` renders the spec's error table with the **description column
shifted down one row**, because the `-32603` description wraps onto three lines and the next code
(`0`) prints beside its last line. Read naively, every code appears to carry the *following* code's
meaning. **The tell was the nonsense it produced — `77 = "Проведено успешно"` (77 = "completed
successfully").** A code table where the success code is 77 and not 0 should stop the reader.

**How it was settled:** re-extract **without `-layout`** (raw reading order). The table emits
**32 codes, then 32 descriptions**, pairing 1:1 — and the pairing matches the annex **exactly**:

```
pdftotext -enc UTF-8 UWS_JSON.pdf out.txt     # raw order — trustworthy for tables
pdftotext -enc UTF-8 -layout UWS_JSON.pdf …   # pretty, but misaligns wrapped rows
```

`0` success · `77` insufficient funds to cancel · `100` service unsupported · `101` quota ·
`102` system · `103` unknown · `201` **already exists** · `202` already cancelled · `301` number
not found · `302` client not found · `304` product · `305` service · `401-410` param 1-10.

**The spec only ADDS codes the annex lacks — it changes none:**

| code | meaning | note |
|---|---|---|
| `113` | wallet not identified | ✚ spec only |
| `140` | monthly limit exceeded | ✚ spec only |
| `141` | daily limit exceeded | ✚ spec only |
| `203` | **transaction not found** | ✚ spec only — the right answer for an unknown `transactionId` |
| `415` | **amount exceeds the maximum limit** | ✚ spec only — proves a ceiling exists (blocker ④) |

⚠️ **Lesson worth keeping: when two sources appear to disagree, suspect the reader before the
sources — above all when one of them is a table pulled out of a PDF.**

## 7. Error codes (both documents; ✚ marks spec-only additions)

| Code | Meaning |
|---|---|
| 0 | Success |
| 77 | **Insufficient funds on the client's account to cancel the payment** |
| 100 · 101 | Service temporarily unsupported · quota exhausted |
| 102 · 103 | System error · unknown error |
| 201 · 202 | **Transaction already exists** · already cancelled |
| 301 · 302 | Number does not exist · client not found |
| 304 · 305 | Product not found · service not found |
| 401–410 | Validation error on parameter 1–10 |
| 411 · 412 · 413 · 414 | Missing required parameter(s) · bad login · **bad amount** · bad date format |
| 501 | Transactions forbidden for this payer |
| 601 · 603 | Access denied · bad command code |

🔴 **`201` is the idempotency contract** — a repeated `transactionId` must return "already exists",
never a second credit.
🔴 **`77` is the refund rule** — a cancellation must be refused when the payer has already spent the
money. **An append-only ledger answers this; a mutable balance column cannot.**

## 8. Reconciliation

Paynet emails a daily register of accepted payments **and** independently calls `GetStatement` to
compare against our records. **Daily reconciliation is contractual**, which makes the owner's
*"finansiviy analiz"* requirement a hard requirement rather than a nice-to-have.

## 9. What is genuinely still missing (revised 2026-08-16)

**Only ONE of the original four is truly unanswerable from the documents.**

1. 🛑 **STILL MISSING — UbexGo's own `serviceId`, service URL, username and password.** Not in
   either document; the annex's Table 1 is filled in for **"TV Turon Navoi"**
   (`https://navpay.tn.uz/paynet/api/webservice`). ⚠️ **Do not hard-code any of it. Env only.**
2. 🟡 **PARTLY ANSWERED — the `fields` set.** The **request** side is settled: `client_id` inside
   `fields` (spec §3.1/§3.2). The **response** side is per-provider; the spec's example returns
   `balance` + `name`. **We send the masked phone in `name`** — confirm that is acceptable, since
   the alternative is disclosing a real name to whoever calls.
3. ✅ **FULLY ANSWERED — the codes.** The sign is **positive** for business errors (negative is
   JSON-RPC's own protocol range, §4), and **the two documents agree on every number** (§6a).
   **Neither question needed asking.**
4. 🟡 **PARTLY ANSWERED — a ceiling exists** (`415`, spec only). **Ask for the value**, and for what
   should happen to an over-payment.
5. 🛑 **Payme and Click are NOT covered by these documents** and remain unspecified (T-093).

### The message actually worth sending Paynet
**Only two things are genuinely unanswerable from the documents:**
1. 🛑 **Our `serviceId`, URL, username, password.** *(Sent by the owner 2026-08-16.)*
2. 🟡 **The value of the maximum single payment** (code `415`), and the rule for an over-payment.
3. 🟡 *Courtesy check, not a blocker:* confirmation that `GetInformation` may return a **masked
   phone** in `fields.name` rather than a legal name. We can ship either way; masking is the safer
   default and can be changed in one function.
