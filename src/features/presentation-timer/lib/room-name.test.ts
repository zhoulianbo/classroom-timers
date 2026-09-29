import assert from 'node:assert/strict'
import { test } from 'node:test'
import { MAX_ROOM_NAME_LENGTH, parseRoomName } from './room-name'

test('accepts ordinary classroom names', () => {
  assert.equal(parseRoomName('  Presentation room  '), 'Presentation room')
  assert.equal(parseRoomName('三年二班展示'), '三年二班展示')
  assert.equal(parseRoomName('Mr. Li period 3'), 'Mr. Li period 3')
  assert.equal(parseRoomName('A'.repeat(MAX_ROOM_NAME_LENGTH))?.length, MAX_ROOM_NAME_LENGTH)
})

test('rejects empty, overlong, urls, and injection', () => {
  assert.equal(parseRoomName('   '), null)
  assert.equal(parseRoomName('A'.repeat(MAX_ROOM_NAME_LENGTH + 1)), null)
  assert.equal(parseRoomName('https://evil.com'), null)
  assert.equal(parseRoomName('www.evil.com'), null)
  assert.equal(parseRoomName('evil.com/join'), null)
  assert.equal(parseRoomName('Visit google.com'), null)
  assert.equal(parseRoomName('javascript:alert(1)'), null)
  assert.equal(parseRoomName('<script>alert(1)</script>'), null)
  assert.equal(parseRoomName('[click](https://evil.com)'), null)
  assert.equal(parseRoomName('hello@gmail.com'), null)
  assert.equal(parseRoomName('ht tp://evil.com'), null)
  assert.equal(parseRoomName('google . com'), null)
})
