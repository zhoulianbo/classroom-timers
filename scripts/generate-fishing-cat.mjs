// Editable vector artwork for the Pomodoro cat. Regenerate with:
// node scripts/generate-fishing-cat.mjs
// The supplied boat.json stays intact; only the character is replaced in the copy.
import { readFileSync, writeFileSync } from 'node:fs'

const source = new URL('../public/animations/boat.json', import.meta.url)
const output = new URL('../public/animations/cat-boat.json', import.meta.url)
const animation = JSON.parse(readFileSync(source, 'utf8'))
const color = hex => hex.match(/\w\w/g).map(value => parseInt(value, 16) / 255)
const fixed = k => ({ a: 0, k })
const fur = 'DEA45F', shadow = 'C28749', stripe = 'B77940'
const cream = 'FFF0D3', ink = '694B36', pink = 'D89482'
const transform = (position = [0, 0], anchor = [0, 0]) => ({
  a: fixed(anchor), p: fixed(position), s: fixed([100, 100]),
  r: fixed(0), o: fixed(100), sk: fixed(0), sa: fixed(0),
})

// Convert the small, deliberately limited SVG path vocabulary used below to
// Lottie's relative cubic handles. Keeping paths readable makes pose edits easy.
function pathData(d) {
  const tokens = d.match(/[MLCQZ]|-?\d*\.?\d+/g)
  const v = [], i = [], o = []
  let cursor = 0, closed = false
  const point = () => [+tokens[cursor++], +tokens[cursor++]]
  const add = p => { v.push(p); i.push([0, 0]); o.push([0, 0]) }
  while (cursor < tokens.length) {
    const command = tokens[cursor++]
    if (command === 'M' || command === 'L') add(point())
    else if (command === 'C' || command === 'Q') {
      const previous = v.at(-1)
      let c1 = point(), c2, end
      if (command === 'Q') {
        end = point()
        c2 = end.map((n, axis) => n + (c1[axis] - n) * 2 / 3)
        c1 = previous.map((n, axis) => n + (c1[axis] - n) * 2 / 3)
      } else { c2 = point(); end = point() }
      o[o.length - 1] = c1.map((n, axis) => n - previous[axis])
      add(end)
      i[i.length - 1] = c2.map((n, axis) => n - end[axis])
    } else if (command === 'Z') closed = true
    else throw new Error(`Unsupported path command: ${command}`)
  }
  if (closed && v.length > 1 && v[0].every((n, axis) => n === v.at(-1)[axis])) {
    i[0] = i.pop(); v.pop(); o.pop()
  }
  return { c: closed, v, i, o }
}
function group(name, geometry, fill, stroke, width = 1.2) {
  return { ty: 'gr', nm: name, it: [
    geometry,
    ...(fill ? [{ ty: 'fl', c: fixed(color(fill)), o: fixed(100), r: 1 }] : []),
    ...(stroke ? [{ ty: 'st', c: fixed(color(stroke)), o: fixed(100), w: fixed(width), lc: 2, lj: 2 }] : []),
    { ty: 'tr', ...transform() },
  ] }
}
const path = (name, d, fill, stroke, width) => group(name, { ty: 'sh', ks: fixed(pathData(d)) }, fill, stroke, width)
const ellipse = (name, x, y, w, h, fill) => group(name, { ty: 'el', p: fixed([x, y]), s: fixed([w, h]) }, fill)
function layer(ind, name, parent, artwork, position = [0, 0]) {
  return { ddd: 0, ind, ty: 4, nm: name, parent, sr: 1,
    ks: transform(position), ao: 0, shapes: artwork.toReversed(),
    ip: 0, op: 96, st: 0, bm: 0 }
}
const keys = values => ({ a: 1, k: values.map(([t, s], index) => ({
  t, s, ...(index < values.length - 1 ? { o: { x: .33, y: 0 }, i: { x: .67, y: 1 } } : {}),
})) })

// Author the cat in scene coordinates at frame zero. This root is attached to
// the boat, cancelling its initial translation so every part shares its bob.
const boat = animation.layers.find(l => l.nm === 'Boat')
const boatOffset = boat.ks.p.k[0].s.map((value, axis) => value - boat.ks.a.k[axis])
const root = { ...layer(30, 'Cat / boat attachment', boat.ind, [], boatOffset.slice(0, 2).map(n => -n)), ty: 3 }
delete root.shapes

const body = layer(33, 'Cat / seated body', 30, [
  path('Rounded back and tucked haunch', 'M 223 251 C 200 255 192 279 189 299 C 180 309 177 328 191 338 C 204 347 250 343 263 337 C 273 331 267 320 257 316 C 253 300 256 281 248 263 C 243 253 233 249 223 251 Z', fur, shadow, 1.3),
  path('Cream chest', 'M 229 259 C 236 255 245 257 248 265 C 254 284 247 298 254 315 C 244 322 225 320 220 310 C 229 295 221 277 229 259 Z', cream),
  path('Folded hind leg', 'M 214 306 C 228 303 240 313 238 325 C 245 323 259 324 265 329 C 270 334 265 340 254 340 L 217 340 C 204 339 199 333 199 325', fur, shadow, 1.3),
  path('Hind paw sock', 'M 250 325 C 260 324 269 329 267 334 C 267 339 261 341 250 340 C 253 336 252 330 250 325 Z', cream),
  path('Hind paw toes', 'M 256 333 L 256 338', null, shadow, 1),
  path('Haunch stripe', 'M 188 309 Q 197 308 201 314 Q 194 315 186 318 Z', stripe),
  path('Back stripe upper', 'M 201 272 Q 210 270 216 275 Q 208 280 197 281 Z', stripe),
  path('Back stripe lower', 'M 195 288 Q 204 285 211 290 Q 206 296 192 297 Z', stripe),
])
const tail = layer(34, 'Cat / curled tail', 30, [
  path('Tail curve', 'M 202 329 C 187 338 162 339 151 328 C 143 319 148 302 158 304 C 167 307 158 315 163 321 C 170 329 187 323 196 319', null, shadow, 14),
  path('Tail fur', 'M 202 329 C 187 338 162 339 151 328 C 143 319 148 302 158 304 C 167 307 158 315 163 321 C 170 329 187 323 196 319', null, fur, 11),
  path('Tail cream tip', 'M 157 304 Q 162 305 160 311', null, cream, 11),
  path('Tail stripe', 'M 152 323 L 160 321', null, stripe, 4),
  path('Tail stripe two', 'M 170 335 L 171 325', null, stripe, 4),
])
tail.ks.a = fixed([200, 329])
tail.ks.p = fixed([200, 329])
tail.ks.r = keys([[0, [0]], [24, [-2]], [48, [0]], [72, [2]], [96, [0]]])

const head = layer(32, 'Cat / attentive face', 30, [
  path('Head silhouette and ears', 'M 212 220 C 210 211 207 192 211 190 C 215 188 230 204 234 205 C 244 202 252 203 259 207 C 263 202 271 190 275 192 C 279 194 277 216 274 224 C 283 235 281 249 270 258 C 258 269 232 270 218 260 C 204 251 201 232 212 220 Z', fur, shadow, 1.3),
  path('Far inner ear', 'M 216 199 Q 225 205 229 212 L 217 219 Z', pink),
  path('Near inner ear', 'M 272 201 Q 273 211 270 218 L 264 212 Z', pink),
  path('Left cheek tuft', 'M 208 239 L 201 242 L 209 247 L 204 249 L 218 254', fur),
  path('Cream cheek and muzzle', 'M 240 242 C 246 235 255 236 260 240 C 266 235 277 234 280 241 C 284 252 270 261 259 262 C 249 264 235 258 235 251 C 235 247 237 244 240 242 Z', cream),
  path('Forehead stripe left', 'M 231 208 Q 229 219 235 222 Q 239 216 236 206 Z', stripe),
  path('Forehead stripe middle', 'M 242 205 Q 239 216 245 220 Q 249 215 247 205 Z', stripe),
  path('Forehead stripe right', 'M 253 207 Q 250 218 256 221 Q 260 215 258 208 Z', stripe),
  path('Cheek stripe upper', 'M 208 229 Q 217 228 222 233 Q 216 236 208 234 Z', stripe),
  path('Cheek stripe lower', 'M 209 242 Q 216 239 223 244 Q 219 248 213 248 Z', stripe),
  path('Nose', 'M 268 241 Q 273 239 277 241 Q 276 245 272 247 Q 269 245 268 241 Z', pink, ink, .7),
  path('Soft smile', 'M 272 247 L 271 250 Q 267 254 263 250', null, ink, 1.1),
  path('Muzzle bridge', 'M 271 250 Q 275 252 278 248', null, ink, 1),
  path('Whisker one', 'M 239 246 Q 230 242 224 244', null, cream, 1.1),
  path('Whisker two', 'M 240 251 L 226 252', null, cream, 1.1),
  path('Whisker three', 'M 279 245 L 289 242', null, cream, 1.1),
  path('Whisker four', 'M 279 250 L 291 251', null, cream, 1.1),
])
const eyes = layer(35, 'Cat / slow blink', 30, [
  ellipse('Far eye', 244, 233, 4.8, 7, ink),
  ellipse('Near eye', 268, 231, 4.6, 7, ink),
  ellipse('Far eye glint', 245, 232, 1.3, 1.7, cream),
  ellipse('Near eye glint', 269, 230, 1.2, 1.6, cream),
])
eyes.ks.a = fixed([256, 233])
eyes.ks.p = fixed([256, 233])
eyes.ks.s = keys([[0, [100, 100]], [54, [100, 100]], [57, [100, 12]], [60, [100, 100]], [96, [100, 100]]])

// Reparent the original rod to the new cat rig without changing its original
// anchor, flex or fishing-line keys. Both forelegs share the rod transform:
// the wrists never slide off their grips during its gentle rotation.
const rod = animation.layers.find(l => l.nm === 'fishing slip')
const oldLayers = new Map(animation.layers.map(l => [l.ind, l]))
function translation(l) {
  const parent = l.parent ? translation(oldLayers.get(l.parent)) : [0, 0]
  const position = l.ks.p.a ? l.ks.p.k[0].s : l.ks.p.k
  return parent.map((value, axis) => value + position[axis] - l.ks.a.k[axis])
}
const rodOffset = translation(rod)
rod.parent = root.ind
rod.ks.p = fixed(rodOffset.map((value, axis) => value + rod.ks.a.k[axis]))
rod.shapes = rod.shapes.filter(g => ['chip fita', 'Group 9', 'Group 10', 'Group 11', 'Chip Hand'].includes(g.nm))
const paws = layer(31, 'Cat / forelegs holding rod', rod.ind, [
  path('Far foreleg', 'M 247 266 C 254 265 259 275 264 274 L 291 251 C 296 247 302 249 302 254 C 303 259 298 262 293 264 L 267 287 C 259 293 250 284 243 278 Z', shadow, stripe, 1),
  path('Upper cream paw', 'M 290 252 C 292 247 299 247 303 250 C 307 252 304 258 300 261 L 294 264 C 290 261 288 256 290 252 Z', cream, shadow, 1),
  path('Near foreleg', 'M 225 271 C 231 267 238 271 242 281 L 248 293 Q 251 298 257 294 L 272 276 C 276 272 282 272 285 276 C 289 281 282 285 279 289 L 264 307 C 257 315 246 316 239 307 C 232 298 220 281 225 271 Z', fur, shadow, 1.2),
  path('Lower cream paw', 'M 271 277 C 272 272 279 271 283 274 C 289 277 285 283 281 286 L 276 290 Q 269 286 271 277 Z', cream, shadow, 1),
  path('Upper paw toes', 'M 297 252 L 301 254', null, shadow, .9),
  path('Lower paw toes', 'M 277 277 L 281 279', null, shadow, .9),
  path('Foreleg stripe', 'M 229 286 L 236 282 L 241 289 L 233 293 Z', stripe),
], rodOffset.map(value => -value))

animation.nm = 'Calm ginger cat fishing — Pomodoro'
animation.layers = animation.layers.filter(l => ![12, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25].includes(l.ind))
const rodIndex = animation.layers.indexOf(rod)
animation.layers.splice(rodIndex, 0, paws)
animation.layers.push(eyes, head, body, tail, root)

// A separate, non-looping reward segment: lift the rod, swing a fish towards
// the boat, then lower it behind the gunwale. The idle loop stays at 0–96.
animation.op = 168
animation.markers = [{ tm: 0, cm: 'fishing', dr: 96 }, { tm: 96, cm: 'catch', dr: 72 }]
for (const l of animation.layers) l.op = 168
const idleRotation = rod.ks.r.k.filter(key => key.t < 96)
rod.ks.r = { a: 1, k: [...idleRotation, ...keys([
  [96, [0]], [112, [-12]], [130, [-22]], [148, [-16]], [160, [-7]], [168, [0]],
]).k] }
for (const l of [head, eyes]) {
  // Rotate both eyes with the head while retaining the blink's own scale pivot.
  if (l === head) { l.ks.a = fixed([256, 233]); l.ks.p = fixed([256, 233]) }
  l.ks.r = keys([[0, [0]], [96, [0]], [125, [-4]], [148, [-4]], [168, [0]]])
}

// Keep the original slack line for idle fishing. During reeling, the mouth of
// the fish and the end of this new line use exactly the same position keys.
const slackLine = rod.shapes.find(g => g.nm === 'chip fita')
slackLine.it.find(item => item.ty === 'tr').o = keys([[0, [100]], [95, [100]], [96, [0]], [168, [0]]])
const fishPositions = [[96, [304, 248]], [112, [280, 215]], [130, [210, 170]], [148, [105, 165]], [160, [75, 190]], [168, [75, 190]]]
const line = path('Reeling line', 'M 308 11 Q 310 135 304 248', null, 'F5F5F7', .9)
line.cl = 'pomodoro-fishing-line'
line.it[0].ks = keys(fishPositions.map(([t, [x, y]]) => [t, [pathData(`M 308 11 Q ${Math.round((308 + x) / 2) + 12} ${Math.round((11 + y) / 2)} ${x} ${y}`)]]))
const lineLayer = layer(37, 'Catch / taut fishing line', rod.ind, [line])
lineLayer.ip = 96
lineLayer.op = 168
const fish = layer(38, 'Catch / one fish', rod.ind, [
  path('Tail fins', 'M -4 32 L -13 47 Q 0 43 12 48 L 4 32 Z', '51A89C'),
  path('Dorsal fin', 'M 8 10 L 19 21 L 10 28 Z', '51A89C'),
  path('Fish body', 'M 0 0 C 14 4 17 20 9 31 Q 0 41 -8 31 C -16 20 -13 5 0 0 Z', '83C8BD', '51A89C', 1),
  path('Pale belly', 'M -5 5 C -12 17 -8 29 0 34 C -9 32 -15 13 -5 5 Z', 'D8F0D7'),
  path('Side fin', 'M 2 18 L 10 25 L 1 24 Z', '51A89C'),
  ellipse('Fish eye', 4, 9, 4, 4, ink),
  ellipse('Fish eye glint', 4.5, 8.5, 1.2, 1.2, cream),
])
fish.ip = 96
fish.op = 168
fish.ks.p = keys(fishPositions)
// Straight spatial segments match the interpolated line endpoint exactly.
for (const key of fish.ks.p.k) { key.to = [0, 0]; key.ti = [0, 0] }
fish.ks.r = keys([[96, [0]], [108, [-12]], [120, [12]], [132, [-10]], [144, [10]], [156, [-6]], [168, [0]]])
fish.ks.o = keys([[96, [0]], [100, [100]], [154, [100]], [164, [0]], [168, [0]]])
animation.layers.splice(animation.layers.indexOf(rod), 0, fish, lineLayer)
writeFileSync(output, JSON.stringify(animation))
console.log(`Generated ${output.pathname}`)
