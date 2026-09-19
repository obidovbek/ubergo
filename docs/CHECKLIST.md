# ✅ CHECKLIST — does everything actually work?

> **Run `npm test` in all three projects first (§0), then walk what is left on a real phone.**
> Since T-118 the automatic tests cover most of §2, §3, §4, §7 and §8 — the phone walk is now
> for what tests cannot see: fonts, layout, SMS autofill, push, the native build, Google SSO.
> Written in plain language on purpose: anyone can run it, not just a programmer.
>
> **How to read it:** each line says _what you do_ and _what you should see_.
> If what you see is different — that's a bug. Write down which line failed.
>
> | Mark | Meaning                                                                           |
> | ---- | --------------------------------------------------------------------------------- |
> | 🔴   | **Changed on 2026-08-02 — test this first.** Most likely to be broken.            |
> | ⚪   | Normal check. Should already work.                                                |
> | 🚫   | **Cannot be tested — the screen does not exist yet.** Not a bug, missing feature. |
>
> Last updated: 2026-09-14 (T-118 — §0 now starts with the automatic tests, and the
> "Later" section at the bottom records which of its four items are done).
> The 🔴 marks below are still from 2026-08-02, after the test3 deploy of the T-018 order
> screen + the driver-connection fixes.

---

## 0. Before you start

- [ ] 🤖 **Run the automatic tests first — they are faster than you and they never get bored.**
      `npm test` in `api,admin,db/apps/api`, in `user-app-standalone` and in
      `driver-app-standalone` (≈1 minute each). **If any of them is red, stop and fix that
      first** — do not start walking the phone. CI runs the same three on every push.
      *What they already cover, so you can walk past it quickly:* §2 login (both apps, phone →
      OTP → wrong code → right code), §3 the order form, §4 and §8 the two merged lists,
      §7 both halves of the driver↔passenger connection, and the district/QFY rules.
      **They cannot see:** fonts and weights, the layout against the artboard, SMS autofill,
      push actually arriving, the native build, or anything Google SSO. That is what the rest
      of this walk is for.
- [ ] ⚪ The API is running: open `https://test3.fstu.uz/api/health` in a browser.
      You should see `"status": "ok"` and `"database": "connected"`.
- [ ] ⚪ Install the **newest** build of both apps. An old app + new API will look
      broken in ways that are not real bugs.
- [ ] ⚪ Use **two different phones** if you can — one small screen, one large.
- [ ] ⚪ Use **two different accounts**: one passenger, one driver. They must be
      different phone numbers.

---

## 1. Known problem — read this first

- [ ] 🚫 **The driver cannot see passenger orders at all.**
      The driver's "search passenger orders" screen is missing a file
      (`driver-app-standalone/api/geo.ts`), so the screen cannot even open.
      Until that file is added, everything in section 6 is impossible to test.
      This is known and written down — do not spend time on it.

- [ ] 🚫 **Nobody can connect a driver to an order yet.**
      There is no button for a driver to say "I'll take this order", and no
      screen for a passenger to accept or refuse a driver. The server side is
      finished and correct; the screens have not been built. Section 7 is
      therefore untestable today.

---

## 2. Logging in and registering

- [ ] ⚪ New phone number → you get an SMS with a code.
- [ ] ⚪ The code fills itself in automatically (you should not have to type it).
- [ ] ⚪ Type a **wrong** code → you see a clear message, not a blank screen.
- [ ] ⚪ On the code screen, **close the app completely** and open it again →
      you come back to the code screen, not to the main menu.
- [ ] ⚪ Start registering, fill half the form, close the app, open it again →
      it continues where you stopped.
- [ ] 🔴 Ask for a code **6 times in a row** → you get "too many attempts".
      Then ask from a **different phone** → that phone should still work.
      _(Before today, one person hitting the limit blocked everybody.)_
- [ ] ⚪ Log in, then have the account deleted in the admin panel, then use the
      app → you are thrown out to the login screen.
- [ ] 🔴 **Turn on airplane mode WHILE the code is being sent** (press the button,
      then switch it on immediately) → the message must say the connection timed
      out, in your language — **not** "could not send the code".
      **Do it in BOTH apps.** _(T-123, fixed 2026-09-18. Before today every kind of
      dropped connection looked like a generic failure, and nothing in the test
      suites can see this one — it needs a real radio.)_

---

## 3. Passenger — creating an order (the big new screen)

- [ ] 🔴 Open "create order". The region list loads within a few seconds.
- [ ] 🔴 **Turn off mobile data**, then open the screen → you see a red error
      message under the card. _(Before today it showed an empty list with no
      explanation, and sometimes crashed.)_
- [ ] ⚪ Pick region → the city/district list appears.
- [ ] ⚪ Pick a city that has small villages → a third list appears.
      Pick a city that has none → no third list. Both are normal.
- [ ] ⚪ Type a landmark ("mo'ljal") → it shows in the grey summary line below.
- [ ] ⚪ Same for the "where to" card.
- [ ] ⚪ Turn on ⚡ "hoziroq" → the time pickers disappear.
- [ ] ⚪ Turn it off → date + two times come back.
- [ ] ⚪ Set a departure time **in the past** → it refuses with
      "must be at least 30 minutes from now".
- [ ] ⚪ Set the arrival time **before** the departure time → it refuses.
- [ ] ⚪ Payment: tap "Naqd" → selected. Tap it again → unselected.
      Only one payment type can be on at a time.
- [ ] ⚪ Tap "Do'stimga" → a phone box appears, already showing `+998`.
- [ ] ⚪ Leave that phone box almost empty → it refuses to submit.
- [ ] ⚪ Type a foreign number like `+33 6 12 34 56 78` → it accepts.
- [ ] ⚪ Vehicle class: only one of the five can be chosen; tapping the chosen
      one turns it off.
- [ ] ⚪ Seats: tap **+** → it asks "Erkak / Ayol". Pick one → a seat fills in
      with the right icon and the green number goes up.
- [ ] ⚪ Tap **−** when the row has only men → it removes one without asking.
      With both men and women in the row → it asks which one.
- [ ] ⚪ Front row stops at 1 seat, back row stops at 3.
- [ ] ⚪ Choose "Butun salon" → the seat buttons grey out and stop working.
      Tap it again → they work again.
- [ ] ⚪ Tick the flags (baggage, roof rack, trailer, animals, woman in car).
- [ ] ⚪ Tick "pitakka chiqib turaman" → a text box appears.
- [ ] ⚪ Try to submit with **nothing filled in** → you get a clear message
      naming the first missing thing, not a crash.
- [ ] 🔴 Fill everything properly and submit → success message, and the order
      appears in "My orders".
- [ ] 🔴 **Look at the price on that new order in "My orders"** → it should say
      "Narx kelishiladi". _(This is exactly where the app crashed before today.)_
- [ ] ⚪ Open "Maxsus buyurtma" → the panel opens in place.
- [ ] ⚪ Type a price → it formats itself with spaces (150 000).
- [ ] ⚪ Submit the special order with **no price** → it refuses.
- [ ] ⚪ Submit it **with** a price → success, appears in "My orders".
- [ ] ⚪ Do all of this again on the **second phone** (different screen size).
      Nothing should be cut off or overlapping.
- [ ] ⚪ Make the phone's font size very large in Android settings → check again.
- [ ] 🔴 Create **21 orders quickly** → the 21st says "too many requests".
      Then create one from the **other account** → it must work.
      _(Before today, 20 orders from anyone blocked the whole platform.)_

---

## 4. Passenger — my orders

- [ ] ⚪ The list shows your orders, newest first.
- [ ] ⚪ Each one has a coloured status label.
- [ ] ⚪ Tap "cancel" on an active order → it turns to cancelled.
- [ ] ⚪ Switch the filter tabs (all / active / finished) → the list changes.
- [ ] 🚫 A blue "Haydovchi topildi" label should appear once a driver is
      accepted — cannot be tested until the accept screen exists.

---

## 5. Passenger — finding and joining a driver's trip

- [ ] ⚪ Search screen: pick from/to, see a list of driver trips.
- [ ] ⚪ Filter by price → the list narrows.
- [ ] ⚪ Open one trip → you see the driver, the car and the price.
- [ ] ⚪ Ask for more seats than are free → it refuses with a clear message.
- [ ] ⚪ Join a trip → the driver's phone gets a notification.
- [ ] 🔴 **Check the language of that notification**: if the driver's app is set
      to Russian, the notification must arrive in **Russian**, even if you (the
      passenger) use Uzbek. _(This was backwards until today.)_
- [ ] ⚪ The trip appears in "My bookings".
- [ ] ⚪ Cancel the booking → the driver gets a notification.
- [ ] 🔴 **T-102i — searching FOR your order, by village (QFY).** Needs the API deploy AND a user-app
      rebuild. Set it up with two drivers on the same trip: driver A picks the **QFY** (e.g. *Yaypan*)
      in his offer; driver B picks only the **district** (*Qo'qon*), no QFY.
      - As a passenger, create a **Tuman ichi** order *from Yaypan* → after "OK" you land on the search.
        A dark chip reads *"Buyurtmangiz bo'yicha · Tuman ichi"*, and the route names **Yaypan**.
      - **Both** drivers appear; **only B's card** says *"Haydovchi faqat tumanni ko'rsatgan, QFYni
        emas"*. A driver who picked a **different** QFY in Qo'qon must **not** appear.
      - Tap **✕** on the chip → the chip and the QFY vanish and the list is the plain district search.
      - Change the route by hand (tap from/to) → the chip goes away too.
      - A **Viloyatlar aro** order behaves exactly as before — district level, no card notes.
      _Few village matches at first is expected: most offers predate QFYs until the backfill runs._

---

## 6. Driver — looking at passenger orders 🚫

**All of this is blocked** — the screen cannot open (see section 1).
When the missing file is added, check:

- [ ] 🚫 The list of passenger orders opens.
- [ ] 🔴🚫 **Type a budget in the filter (for example 100 000) → orders that have
      no price must STILL be in the list.** _(This is the fix that stops the
      driver's screen looking empty.)_
- [ ] 🚫 An order made with the new form shows: the time window, ⚡ if urgent,
      the seat breakdown (2♂ 1♀), the class, the flags, the landmarks.
- [ ] 🚫 An order with no price shows "Narx kelishiladi", not a broken number.
- [ ] 🚫 The passenger's friend's phone number is **never** shown to the driver.

---

## 7. Driver ↔ passenger connection 🚫

**No screens exist for this yet.** The server is ready and correct. When the
screens are built, this is what must be checked:

- [ ] 🚫 Driver sends an offer on an order → the passenger gets a notification
      **in the passenger's own language**.
- [ ] 🚫 The passenger sees the list of drivers who offered.
- [ ] 🚫 The passenger accepts one driver → that driver gets "accepted".
- [ ] 🔴🚫 **All the other drivers get "another driver was chosen"** and their
      request stops being "waiting". _(They used to wait forever with no news.)_
- [ ] 🔴🚫 **The order becomes "driver found", NOT "finished".** The trip has not
      happened yet.
- [ ] 🔴🚫 Try to accept a **second** driver → it must refuse. One order, one car.
- [ ] 🚫 The passenger can still cancel after accepting → the accepted driver is
      told.
- [ ] 🚫 A driver who cancels his own offer cannot offer on that order again.
      _(This is on purpose — anti-spam.)_
- [ ] 🚫 A driver with 3 free seats cannot take an order that needs the whole
      car (4 seats) — he gets a clear message.

---

## 8. Driver — his own trips

- [ ] ⚪ Create a trip in the wizard, all 4 steps.
- [ ] ⚪ It appears in the offers list with the right status.
- [ ] ⚪ Passengers who joined show up.
- [ ] ⚪ Accept a passenger → the passenger gets a notification.
- [ ] 🔴 That notification must be in the **passenger's** language, not yours.
- [ ] ⚪ Refuse a passenger → they get a notification and the seat comes back.
- [ ] ⚪ Cancel the whole trip → every joined passenger gets a notification.
- [ ] 🔴 If three passengers joined and they use three different languages, each
      one must get the message in **their own** language.

---

## 9. Driver — registration and documents

- [ ] ⚪ Fill in personal info, passport, licence, taxi licence, vehicle.
- [ ] ⚪ Photos upload and are visible afterwards.
- [ ] ⚪ Close the app halfway through → it comes back to the same step.
- [ ] ⚪ After finishing, the app does **not** keep re-checking the profile in a
      loop (watch the screen — no repeated flashing).

---

## 10. Notifications in general

- [ ] 🔴 Open each app once after installing → this is when the app tells the
      server which language you use. **Without opening the app at least once
      after this update, notifications stay in Uzbek.**
- [ ] ⚪ A driver and a passenger using the **same** account must each get only
      their own app's notifications.
- [ ] ⚪ Tapping a notification opens the right screen.
- [ ] ⚪ Change the language inside the app, close it, open it again → new
      notifications arrive in the new language.
- [ ] 🔴 **T-116 — errors in YOUR language, not English** (needs the API deploy AND both
      rebuilds). With the phone set to **Russian**, then again in **Uzbek**:
      - **Driver app:** open a ride that already has a booking and lower its seat count below the
        booked seats → the refusal reads *"Нельзя уменьшить количество мест до …"* / *"O'rinlar
        sonini … taga kamaytirib bo'lmaydi …"*, with both numbers filled in — never English.
      - **Driver app:** offer wizard, type a *whole-salon* price LOWER than the *back-salon* price
        → the refusal is in your language.
      - **Driver app → Xabarnomalar:** each notification's time reads *"5 daqiqa oldin"* — a real
        number, **never `{count}`**. Then turn on airplane mode and pull to refresh → a toast
        appears saying the internet is down, in your language. *(Before T-116 this screen showed
        no toast at all — the call crashed.)*
      - **User app → my orders / create an order / notifications:** with airplane mode on, every
        failure says the internet is down in your language — never *"Network request failed"*.
      _Tests prove the code; only a phone proves the rebuild shipped it and the server was deployed._

---

## 11. Profile and settings

- [ ] ⚪ Edit name, birthday, gender → saves and still there after restart.
- [ ] ⚪ Add an extra phone number → it refuses your own main number.
- [ ] ⚪ Change the app language → all text changes.
- [ ] ⚪ Log out → you land on the login screen and stay there after restart.

---

## 12. Admin panel

- [ ] ⚪ Log in as admin.
- [ ] ⚪ The drivers list loads; open one driver and see the documents.
- [ ] ⚪ Approve / reject a driver.
- [ ] ⚪ The passengers list is **not** empty.
- [ ] ⚪ Block a user → that user is thrown out of the app.
- [ ] ⚪ Photos load in the panel (not broken image icons).

---

## 13. System-level

- [ ] ⚪ `kubectl get pods -n test3` → all three pods say `Running`.
- [ ] 🔴 `kubectl logs -f <api-pod> -n test3` → **no more
      `X-Forwarded-For` / `ERR_ERL_UNEXPECTED_X_FORWARDED_FOR` errors.**
      _(That warning should be gone after this deploy.)_
- [ ] ⚪ Uploaded photos still open after a redeploy.
- [ ] ⚪ Restart the API pod → the app keeps working, nobody is logged out.
- [ ] 🔴 **Paynet endpoint, a WRONG password → HTTP `401`** (T-088, 2026-09-19). From an allowed IP
      (or with T-100 still open, however you reach it), `POST /api/paynet` with a bad Basic login and
      a JSON-RPC body with `"id": 1`. **Look at the STATUS, not only the body:** it must be `401`,
      and the body should still be JSON with `"error": {"code": 412}` and `"id": 1`.
      _Tests prove the API sends that; only this proves nginx/Traefik let it through untouched — an
      ingress can swap a 401's body for its own error page._
- [ ] ⚪ Same endpoint, method `ChangePassword` with the RIGHT login → `"error": {"code": 603}`.
      _We deliberately do not offer it — Paynet must be told so; the password lives in env._

---

## Later: turning this into automatic tests

**Updated 2026-09-14 — items 1 and 3 are DONE.** This section was the plan; here is what is
left of it.

- [x] **App screen tests** (was item 3) — **done, card T-118.** Both apps have `npm test`.
      Sections 2, 3, 4, 7 and 8 above are covered by behaviour tests, and the create-order form
      is asserted exactly as written here: fill it in, submit, check what was sent to the server.
      *The first test written against that form found a real bug on its first render* — a stray
      hyphen before every check-row label, live for six weeks.
- [x] **Server rules** (was item 1) — **done, card T-010.** 357 tests over the API's `utils/`.
- [ ] **Server flow tests** (was item 2) — **still open, still T-010.** Create an order → driver
      offers → passenger accepts → the order is `driver_found` and the other drivers are
      `rejected`. Blocked on the same thing it always was: these need a test database, and the
      services import Sequelize models, so the pure logic has to come out of the class first.
- [ ] **End-to-end on an emulator** (Maestro / Detox) — **not boarded on purpose.** Login is a
      real SMS OTP with no test bypass, so an E2E run cannot get past the first screen without
      a backend change. Board it when that bypass is designed.
- [ ] **Full run-through on a real device** — last, because it is the slowest, and now much
      shorter: only the things in §0 that tests cannot see.
