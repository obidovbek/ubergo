# ✅ CHECKLIST — does everything actually work?

> Walk through this on a real phone after every deploy, until we have automatic tests.
> Written in plain language on purpose: anyone can run it, not just a programmer.
>
> **How to read it:** each line says *what you do* and *what you should see*.
> If what you see is different — that's a bug. Write down which line failed.
>
> | Mark | Meaning |
> |------|---------|
> | 🔴 | **Changed on 2026-08-02 — test this first.** Most likely to be broken. |
> | ⚪ | Normal check. Should already work. |
> | 🚫 | **Cannot be tested — the screen does not exist yet.** Not a bug, missing feature. |
>
> Last updated: 2026-08-02, after the test3 deploy of the T-018 order screen +
> the driver-connection fixes.

---

## 0. Before you start

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
      *(Before today, one person hitting the limit blocked everybody.)*
- [ ] ⚪ Log in, then have the account deleted in the admin panel, then use the
      app → you are thrown out to the login screen.

---

## 3. Passenger — creating an order (the big new screen)

- [ ] 🔴 Open "create order". The region list loads within a few seconds.
- [ ] 🔴 **Turn off mobile data**, then open the screen → you see a red error
      message under the card. *(Before today it showed an empty list with no
      explanation, and sometimes crashed.)*
- [ ] ⚪ Pick region → the city/district list appears.
- [ ] ⚪ Pick a city that has small villages → a third list appears.
      Pick a city that has none → no third list. Both are normal.
- [ ] ⚪ Type a landmark ("mo'ljal") → it shows in the grey summary line below.
- [ ] ⚪ Same for the "where to" card.
- [ ] ⚪ Turn on ⚡ "hozioq" → the time pickers disappear.
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
      "Narx kelishiladi". *(This is exactly where the app crashed before today.)*
- [ ] ⚪ Open "Maxsus buyurtma" → the panel opens in place.
- [ ] ⚪ Type a price → it formats itself with spaces (150 000).
- [ ] ⚪ Submit the special order with **no price** → it refuses.
- [ ] ⚪ Submit it **with** a price → success, appears in "My orders".
- [ ] ⚪ Do all of this again on the **second phone** (different screen size).
      Nothing should be cut off or overlapping.
- [ ] ⚪ Make the phone's font size very large in Android settings → check again.
- [ ] 🔴 Create **21 orders quickly** → the 21st says "too many requests".
      Then create one from the **other account** → it must work.
      *(Before today, 20 orders from anyone blocked the whole platform.)*

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
      passenger) use Uzbek. *(This was backwards until today.)*
- [ ] ⚪ The trip appears in "My bookings".
- [ ] ⚪ Cancel the booking → the driver gets a notification.

---

## 6. Driver — looking at passenger orders 🚫

**All of this is blocked** — the screen cannot open (see section 1).
When the missing file is added, check:

- [ ] 🚫 The list of passenger orders opens.
- [ ] 🔴🚫 **Type a budget in the filter (for example 100 000) → orders that have
      no price must STILL be in the list.** *(This is the fix that stops the
      driver's screen looking empty.)*
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
      request stops being "waiting". *(They used to wait forever with no news.)*
- [ ] 🔴🚫 **The order becomes "driver found", NOT "finished".** The trip has not
      happened yet.
- [ ] 🔴🚫 Try to accept a **second** driver → it must refuse. One order, one car.
- [ ] 🚫 The passenger can still cancel after accepting → the accepted driver is
      told.
- [ ] 🚫 A driver who cancels his own offer cannot offer on that order again.
      *(This is on purpose — anti-spam.)*
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
      *(That warning should be gone after this deploy.)*
- [ ] ⚪ Uploaded photos still open after a redeploy.
- [ ] ⚪ Restart the API pod → the app keeps working, nobody is logged out.

---

## Later: turning this into automatic tests

When we build the test suite (card **T-010**), this checklist is the plan.
Suggested order, easiest and most valuable first:

1. **Server rules** — the fastest to automate and where most bugs were found.
   One test per rule: "an order with no price is accepted", "a second driver
   cannot be accepted", "a bad price gives error 400 and not 500", "the budget
   filter keeps orders that have no price".
2. **Server flow tests** — create an order → driver offers → passenger accepts →
   check the order is `driver_found` and the other drivers are `rejected`.
3. **App screen tests** — the create-order form: fill it in, submit, check what
   was sent to the server.
4. **Full run-through on a real device** — last, because it is the slowest.

Sections 2, 3 and 7 above are the ones worth automating first: they cover the
money, the matching and the login, and they are where every bug so far has been.
