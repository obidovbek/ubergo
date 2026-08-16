'use strict';

/**
 * T-092 — new user IDs start at 1 100 001.
 *
 * Only where the NEXT id starts changes. Existing users keep the ids they have:
 * `users.id` is an FK target in `phones`, `user_identities`, `deletion_requests`,
 * `audit_logs`, `push_tokens`, `driver_profiles` and more, so renumbering would
 * rewrite every one of those to buy nothing.
 *
 * 🔴 THE NUMBER BELOW IS 1 100 000, NOT 1 100 001, AND THAT IS THE WHOLE RISK
 * OF THIS MIGRATION. `setval(N, true)` records N as *already handed out*, so the
 * next value is N + 1. Writing the owner's number literally would start users at
 * 1 100 002, and nothing would notice until a real person registered.
 *
 * 🔴 GREATEST, NOT `ALTER SEQUENCE … RESTART WITH`. RESTART moves the sequence
 * BACKWARDS whenever it runs again after ids past the origin exist — a db:reset,
 * an undo+redo, a restore from backup. The next insert then reissues a LIVE
 * primary key and registration starts failing; and if that row had since been
 * deleted, the id is silently reused, after which every `audit_logs` row naming
 * it points at a different person. GREATEST can only move forwards.
 *
 * 🔴 THE SEQUENCE'S OWN last_value IS PART OF THE FLOOR, not just MAX(id).
 * This project deletes users (`deletion_requests`, FKs ON DELETE CASCADE), and a
 * deleted user drops MAX(id) BELOW what has already been handed out. MAX(id)
 * alone would therefore re-issue a departed user's id.
 *
 * ⚠️ NO TRANSACTION WRAPPER, AND THAT IS DELIBERATE (T-095's stated exception).
 * Sequences are non-transactional in Postgres: `setval` is NOT undone by a
 * rollback. A wrapper here would promise a guarantee it cannot give. What T-095
 * is actually protecting against — a half-applied migration — cannot happen when
 * the migration is one statement.
 *
 * ✅ The sequence is found with `pg_get_serial_sequence`, never a hard-coded
 * name. It is owned by the column (`CREATE SEQUENCE … OWNED BY users.id`,
 * migration 20250125000001:298-305), so the catalog can answer this for us.
 * That same migration ends with this exact `setval` idiom (line 391).
 *
 * @type {import('sequelize-cli').Migration}
 */

/**
 * One BELOW the first id we want handed out — see the header. 1 100 000 here
 * means the next user registers as 1 100 001.
 */
const ORIGIN_PREDECESSOR = 1100000;

/** `queryInterface.sequelize.query` returns [rows, metadata] without this. */
const rows = (queryInterface, Sequelize, sql) =>
  queryInterface.sequelize.query(sql, { type: Sequelize.QueryTypes.SELECT });

/**
 * The sequence behind `users.id`, schema-qualified and already quoted for use in
 * SQL. Comes from the catalog, not from anything a user can influence.
 */
async function usersIdSequence(queryInterface, Sequelize) {
  const [row] = await rows(
    queryInterface,
    Sequelize,
    `SELECT pg_get_serial_sequence('users', 'id') AS seq;`
  );

  if (!row || !row.seq) {
    throw new Error(
      'T-092: users.id has no owned sequence. Expected users_id_seq, created by ' +
        '20250125000001-convert-uuids-to-integers. Refusing to guess a name.'
    );
  }

  return row.seq;
}

module.exports = {
  async up(queryInterface, Sequelize) {
    const seq = await usersIdSequence(queryInterface, Sequelize);

    // Read the state first so the run explains itself in the log rather than
    // succeeding silently — the T-046 / T-031 precedent.
    const [before] = await rows(
      queryInterface,
      Sequelize,
      `SELECT last_value, is_called FROM ${seq};`
    );
    const [{ max_id: maxId }] = await rows(
      queryInterface,
      Sequelize,
      `SELECT COALESCE(MAX(id), 0) AS max_id FROM users;`
    );

    // One statement, so the floor is computed and applied without a gap another
    // connection could register into.
    // ⚠️ `last_value` is taken as-is even when is_called = false (meaning it has
    // NOT been handed out yet). That over-counts by at most one id and can never
    // under-count, which is the only direction that matters here.
    const [after] = await rows(
      queryInterface,
      Sequelize,
      `SELECT setval(
         pg_get_serial_sequence('users', 'id'),
         GREATEST(
           (SELECT COALESCE(MAX(id), 0) FROM users),
           (SELECT last_value FROM ${seq}),
           ${ORIGIN_PREDECESSOR}
         ),
         true
       ) AS new_last_value;`
    );

    const next = Number(after.new_last_value) + 1;

    console.log(
      `T-092: ${seq} was last_value=${before.last_value} (is_called=${before.is_called}), ` +
        `users.MAX(id)=${maxId} → now last_value=${after.new_last_value}. ` +
        `The next user to register gets id ${next}.`
    );

    if (next !== ORIGIN_PREDECESSOR + 1) {
      console.log(
        `T-092: note — the sequence was ALREADY past the origin, so it was left where it was. ` +
          `Nothing moved backwards, which is the intended behaviour on a re-run.`
      );
    }
  },

  async down(queryInterface, Sequelize) {
    const seq = await usersIdSequence(queryInterface, Sequelize);

    // 🔴 NEVER `RESTART WITH 1`. Ids 1..N already exist as primary keys, so
    // restarting at 1 would make the next registration collide immediately.
    // The honest reversal is "stop forcing the origin, continue from the data",
    // which is exactly what 20250125000001:391 does.
    // ⚠️ After a user deletion this CAN re-issue a departed user's id — the
    // hazard `up` guards against with last_value. An undo cannot both restore
    // the old numbering and keep that guard, so this is not a step to run
    // casually on a live database.
    const [after] = await rows(
      queryInterface,
      Sequelize,
      `SELECT setval(
         pg_get_serial_sequence('users', 'id'),
         COALESCE((SELECT MAX(id) FROM users), 1),
         true
       ) AS new_last_value;`
    );

    console.log(
      `T-092 (down): ${seq} set to last_value=${after.new_last_value}; ` +
        `the next user gets id ${Number(after.new_last_value) + 1}.`
    );
  }
};
