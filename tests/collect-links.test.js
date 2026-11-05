const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const code = fs.readFileSync('code.js', 'utf8');
const node = (type, name, id, x = 0, y = 0) => ({ type, name, id, absoluteBoundingBox: { x, y } });
function run(selection, fileKey = 'abc123') {
  const messages = [];
  const figma = { currentPage: { selection }, fileKey, showUI() {}, on() {}, ui: { postMessage(m) { messages.push(m); } } };
  vm.runInNewContext(code, { figma, __html__: '' });
  return JSON.parse(JSON.stringify(messages.at(-1)));
}
test('exports instances with nested IDs', () => {
  const r = run([node('INSTANCE', 'V2/Button', 'I262:4631;242:4190')]);
  assert.equal(r.ok, true);
  assert.equal(r.copiedText, 'V2/Button\thttps://www.figma.com/file/abc123?node-id=I262-4631;242-4190');
});
test('mixed selections retain order, repeated names, and ignored types', () => {
  const nodes = [node('INSTANCE', 'Button', '4:2', 1, 2), node('RECTANGLE', 'shape', '8:0'), node('FRAME', 'Frame', '1:0', 4, 1), node('SECTION', 'Section', '3:0', 3, 1), node('INSTANCE', 'Button', '4:1', 1, 2), node('COMPONENT', 'Master', '9:0')];
  const r = run(nodes);
  assert.equal(r.count, 4);
  assert.equal(r.ignoredCount, 2);
  assert.deepEqual(r.ignoredTypes, ['COMPONENT', 'RECTANGLE']);
  assert.equal(r.copiedText, ['Section\thttps://www.figma.com/file/abc123?node-id=3-0','Frame\thttps://www.figma.com/file/abc123?node-id=1-0','Button\thttps://www.figma.com/file/abc123?node-id=4-1','Button\thttps://www.figma.com/file/abc123?node-id=4-2'].join('\n'));
  assert.equal(run(nodes.reverse()).copiedText, r.copiedText);
});
test('empty, unsupported and missing file key are reported', () => {
  assert.equal(run([]).reason, 'empty');
  assert.equal(run([node('TEXT', 't', '1:1')]).reason, 'unsupported');
  assert.equal(run([node('INSTANCE', 'b', '1:1')], null).reason, 'no-file-key');
});
