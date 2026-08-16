/**
 * Tests for the Paynet source-IP allow-list (T-088).
 *
 * 🔴 This list is a contractual obligation AND the main mitigation for
 * `GetInformation` being a name-lookup oracle over ids that T-092 made
 * enumerable. Both failure directions are expensive: too permissive leaks
 * names, too strict refuses real payments and gets us disconnected.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  parseIpv4,
  parseCidr,
  cidrContains,
  loadAllowList,
  isAllowed,
  CidrError
} from './ipAllowList.js';

describe('parseIpv4', () => {
  it('parses the boundaries', () => {
    assert.equal(parseIpv4('0.0.0.0'), 0);
    assert.equal(parseIpv4('255.255.255.255'), 4294967295);
  });

  it('parses a real Paynet address', () => {
    // 213*2^24 + 230*2^16 + 106*2^8 + 112, computed independently rather than
    // copied from the implementation — otherwise this asserts nothing.
    assert.equal(parseIpv4('213.230.106.112'), 213 * 16777216 + 230 * 65536 + 106 * 256 + 112);
    assert.equal(parseIpv4('213.230.106.112'), 3588647536);
  });

  it('accepts an IPv4-mapped IPv6 address, which is how Node reports a v4 peer', () => {
    // Without this, every real Paynet request fails closed on a dual-stack socket.
    assert.equal(parseIpv4('::ffff:213.230.106.112'), parseIpv4('213.230.106.112'));
    assert.equal(parseIpv4('::FFFF:1.2.3.4'), parseIpv4('1.2.3.4'));
  });

  it('trims surrounding whitespace', () => {
    assert.equal(parseIpv4('  1.2.3.4  '), parseIpv4('1.2.3.4'));
  });

  it('rejects octets above 255', () => {
    assert.equal(parseIpv4('256.0.0.1'), null);
    assert.equal(parseIpv4('1.2.3.999'), null);
  });

  it('rejects the wrong number of octets', () => {
    assert.equal(parseIpv4('1.2.3'), null);
    assert.equal(parseIpv4('1.2.3.4.5'), null);
    assert.equal(parseIpv4(''), null);
  });

  it('rejects trailing rubbish rather than parsing a prefix of it', () => {
    // The `parseInt` trap: it would happily return 213 from "213abc".
    assert.equal(parseIpv4('213.230.106.112abc'), null);
    assert.equal(parseIpv4('1.2.3.4x'), null);
  });

  it('rejects leading zeros as ambiguous rather than guessing a base', () => {
    assert.equal(parseIpv4('010.1.1.1'), null);
    assert.equal(parseIpv4('1.1.1.01'), null);
    // A single zero is not padding and stays legal. (0.1.1.1, not 1.1.1.1 —
    // 16843009 is the latter, which is what this line first asserted.)
    assert.equal(parseIpv4('0.1.1.1'), 65793);
    assert.equal(parseIpv4('1.1.1.1'), 16843009);
  });

  it('rejects a non-numeric address', () => {
    assert.equal(parseIpv4('not.an.ip.addr'), null);
    assert.equal(parseIpv4('1.2.3.-4'), null);
  });
});

describe('parseCidr', () => {
  it('masks the address down to its network', () => {
    // .112/28 covers .112-.127, so the network address is .112 itself.
    const cidr = parseCidr('213.230.106.112/28');
    assert.equal(cidr.network, parseIpv4('213.230.106.112'));
    assert.equal(cidr.bits, 28);
  });

  it('masks a host address that is not the network address', () => {
    // .119 is inside .112/28, so both must reduce to the same network.
    assert.equal(parseCidr('213.230.106.119/28').network, parseCidr('213.230.106.112/28').network);
  });

  it('treats a bare address as /32', () => {
    const cidr = parseCidr('1.2.3.4');
    assert.equal(cidr.bits, 32);
    assert.equal(cidr.network, parseIpv4('1.2.3.4'));
  });

  it('handles /0 without the shift-operator trap', () => {
    // `-1 << 32` is -1 in JS, not 0 — a /0 built naively matches NOTHING
    // instead of everything, which is a silent inversion of its meaning.
    const cidr = parseCidr('0.0.0.0/0');
    assert.equal(cidr.network, 0);
    assert.ok(cidrContains(cidr, parseIpv4('8.8.8.8') as number));
    assert.ok(cidrContains(cidr, parseIpv4('255.255.255.255') as number));
  });

  it('throws on a malformed list entry, because that is a config bug', () => {
    assert.throws(() => parseCidr('213.230.106.112/33'), CidrError);
    assert.throws(() => parseCidr('213.230.106.112/-1'), CidrError);
    assert.throws(() => parseCidr('213.230.106.112/abc'), CidrError);
    assert.throws(() => parseCidr('999.1.1.1/28'), CidrError);
    assert.throws(() => parseCidr('1.2.3.4/8/8'), CidrError);
  });
});

describe('the documented Paynet ranges', () => {
  const list = loadAllowList('');

  it('admits both documented networks end to end', () => {
    // 213.230.106.112/28 → .112 .. .127
    assert.ok(isAllowed('213.230.106.112', list), 'first address of range 1');
    assert.ok(isAllowed('213.230.106.127', list), 'last address of range 1');
    assert.ok(isAllowed('213.230.106.120', list), 'middle of range 1');

    // 213.230.65.80/28 → .80 .. .95
    assert.ok(isAllowed('213.230.65.80', list), 'first address of range 2');
    assert.ok(isAllowed('213.230.65.95', list), 'last address of range 2');
  });

  it('refuses the addresses immediately outside each range', () => {
    // The off-by-one that a hand-written mask gets wrong.
    assert.equal(isAllowed('213.230.106.111', list), false, 'one below range 1');
    assert.equal(isAllowed('213.230.106.128', list), false, 'one above range 1');
    assert.equal(isAllowed('213.230.65.79', list), false, 'one below range 2');
    assert.equal(isAllowed('213.230.65.96', list), false, 'one above range 2');
  });

  it('refuses a neighbouring subnet that shares three octets', () => {
    assert.equal(isAllowed('213.230.106.16', list), false);
    assert.equal(isAllowed('213.230.107.112', list), false);
  });

  it('refuses everything else, including localhost and private ranges', () => {
    for (const address of ['8.8.8.8', '127.0.0.1', '10.0.0.1', '192.168.1.1', '0.0.0.0']) {
      assert.equal(isAllowed(address, list), false, `${address} must not be allowed`);
    }
  });
});

describe('isAllowed — fails closed', () => {
  const list = loadAllowList('');

  it('refuses a missing or empty address', () => {
    assert.equal(isAllowed(undefined, list), false);
    assert.equal(isAllowed(null, list), false);
    assert.equal(isAllowed('', list), false);
  });

  it('refuses an unparseable address rather than letting it through', () => {
    assert.equal(isAllowed('not-an-ip', list), false);
    assert.equal(isAllowed('213.230.106.112, 8.8.8.8', list), false);
  });

  it('refuses everything when the list is empty', () => {
    // An empty allow-list must mean "nobody", never "everybody".
    assert.equal(isAllowed('213.230.106.112', []), false);
  });

  it('accepts an IPv4-mapped peer address from a dual-stack socket', () => {
    assert.ok(isAllowed('::ffff:213.230.106.112', list));
  });
});

describe('loadAllowList', () => {
  it('falls back to the documented ranges when env is unset or blank', () => {
    assert.equal(loadAllowList(undefined).length, 2);
    assert.equal(loadAllowList('').length, 2);
    assert.equal(loadAllowList('   ').length, 2);
  });

  it('replaces the defaults rather than adding to them', () => {
    // An override that silently kept the production ranges would be a
    // surprising union — being explicit is the safer default.
    const list = loadAllowList('10.0.0.0/8');
    assert.equal(list.length, 1);
    assert.ok(isAllowed('10.1.2.3', list));
    assert.equal(isAllowed('213.230.106.112', list), false);
  });

  it('accepts several ranges', () => {
    const list = loadAllowList('10.0.0.0/8, 192.168.0.0/16');
    assert.equal(list.length, 2);
    assert.ok(isAllowed('10.1.2.3', list));
    assert.ok(isAllowed('192.168.5.5', list));
  });
});
