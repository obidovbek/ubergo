# 🔌 PAYNET — the integration contract (reference)

> Extracted 2026-08-14 from the owner's two documents in `paynet/`:
> `universal_tech_doc_v_1_5.docx` (the commercial/technical annex) and `UWS_JSON.pdf`
> (the JSON-RPC protocol spec).
> ⚠️ **Neither file can be read by the normal tools on this machine** — there is no `pdftotext` and
> no `pypdf`, and the PDF's Cyrillic prose uses a subset font whose encoding does not survive naive
> extraction. The **JSON payloads and identifiers extracted cleanly**; the Russian narrative did not.
> This file is the readable record. **Re-check anything below against the originals before
> implementing**, and treat the Russian-language details as summarised, not quoted.

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

⚠️ **Sign convention is unconfirmed.** The annex lists error codes as **positive** (`301`, `413`,
`601`…); the JSON sample shows **`-253`**. Confirm with Paynet which form the `error.code` takes
before writing the error mapper — guessing means every failure is misclassified.

## 5. Payloads (verbatim from the JSON spec)

```jsonc
// GetInformation — the agent identifying the payer
{"jsonrpc":"2.0","method":"GetInformation","id":12350,
 "params":{"serviceId":1,"fields":{"client_id":634247}}}
{"jsonrpc":"2.0","id":123,"result":{"client_id":"1463398","fio":"…"}}

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

## 7. Error codes (from the annex)

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

## 9. What is still missing before T-088 can be built

1. **UbexGo's own `serviceId`, service URL, username and password** — not in these documents.
2. **The `fields` set for our service.** The annex's Table 3/4 (`account`, `name`, `balance`,
   `end_date`, `current_tariff`) is the *TV Turon Navoi* definition; the JSON spec uses
   `client_id` / `fio`. **The field set is negotiated per provider** — ours is not yet agreed.
3. **The `error.code` sign convention** (§4).
4. **Whether a Paynet top-up may exceed any ceiling**, and what happens to an over-payment.
5. **Payme and Click are NOT covered by these documents** and remain unspecified.
