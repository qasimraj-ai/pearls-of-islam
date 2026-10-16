/* Stick-figure model for the Intro To Namaz animation.
   The figure is drawn from the side, facing the Qibla (to the right of the screen).
   Every pose is a handful of numbers (angles in degrees, 0 = right, 90 = down), so two poses can be blended smoothly. */

export const GROUND = 240;                       // y of the prayer mat
const L = { torso: 56, thigh: 48, shin: 46, foot: 16, upper: 30, fore: 38, head: 12, neck: 10 };
export const HEAD_R = L.head;

const rad = (d) => (d * Math.PI) / 180;
const add = (p, len, ang) => [p[0] + len * Math.cos(rad(ang)), p[1] + len * Math.sin(rad(ang))];

/* joints for a pose; hip height is found so that the lowest part of the legs rests on the mat */
export function joints(p) {
  const raw = (hy) => {
    const hip = [p.hx, hy];
    const shoulder = add(hip, L.torso, p.torso);
    const head = add(shoulder, L.head + L.neck, p.hang);
    const knee = add(hip, L.thigh, p.thigh);
    const ankle = add(knee, L.shin, p.shin);
    const toe = add(ankle, L.foot, p.foot);
    const elbow = add(shoulder, L.upper, p.ua);
    const hand = add(elbow, L.fore, p.fa);
    return { hip, shoulder, head, knee, ankle, toe, elbow, hand };
  };
  const j0 = raw(0);
  const low = Math.max(j0.knee[1] + 7, j0.ankle[1] + 4, j0.toe[1] + 2); // thickness of the limbs
  return raw(GROUND - low);
}

/* design-time helpers: build a pose from simple descriptions */
function solveArm(shoulder, target, bend) {
  let dx = target[0] - shoulder[0], dy = target[1] - shoulder[1];
  const reach = L.upper + L.fore - 0.5;
  let d = Math.hypot(dx, dy);
  if (d > reach) { dx *= reach / d; dy *= reach / d; d = reach; }
  const a = (L.upper ** 2 - L.fore ** 2 + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, L.upper ** 2 - a * a));
  const ux = dx / d, uy = dy / d;
  const ex = shoulder[0] + a * ux + bend * h * -uy;
  const ey = shoulder[1] + a * uy + bend * h * ux;
  const deg = (x, y) => (Math.atan2(y, x) * 180) / Math.PI;
  return { ua: deg(ex - shoulder[0], ey - shoulder[1]), fa: deg(shoulder[0] + dx - ex, shoulder[1] + dy - ey) };
}

function build(base, handAt, bend = 1) {
  const p = { ua: 90, fa: 90, finger: 0, ...base };
  const j = joints(p);
  const target = handAt(j);
  return { ...p, ...solveArm(j.shoulder, target, bend) };
}

const standBase = { hx: 170, torso: -90, thigh: 90, shin: 90, foot: 0, hang: -84 };

export const POSES = {
  // hands hanging at the sides
  stand: build(standBase, (j) => [j.shoulder[0] + 3, j.shoulder[1] + 66], 1),
  // hands raised next to the ears (takbir)
  takbir: build({ ...standBase, hang: -88 }, (j) => [j.head[0] + 12, j.head[1] + 4], 1),
  // hands folded on the chest or below the navel
  fold: build(standBase, (j) => [j.hip[0] + 17, j.hip[1] - 10], 1),
  // bowing: back level, hands on the knees
  ruku: build({ hx: 170, torso: -4, thigh: 80, shin: 100, foot: 0, hang: -2 }, (j) => [j.knee[0] + 2, j.knee[1] - 4], 1),
  // prostration: forehead, nose, both palms, both knees and toes on the ground
  sajda: build({ hx: 150, torso: 28, thigh: 80, shin: 190, foot: 60, hang: 35 }, (j) => [j.head[0] + 12, GROUND - 4], -1),
  // sitting on the left foot, hands on the thighs
  sit: build({ hx: 150, torso: -88, thigh: 12, shin: 180, foot: 180, hang: -80 }, (j) => [(j.hip[0] + j.knee[0]) / 2 + 6, (j.hip[1] + j.knee[1]) / 2 - 7], 1),
};
POSES.sitFinger = { ...POSES.sit, finger: 1 };

const wrap = (d) => ((((d + 180) % 360) + 360) % 360) - 180;
const ANGLES = ["torso", "thigh", "shin", "foot", "hang", "ua", "fa"];
export function blend(a, b, t) {
  const o = { hx: a.hx + (b.hx - a.hx) * t, finger: t > 0.5 ? b.finger : a.finger };
  ANGLES.forEach((k) => { o[k] = a[k] + wrap(b[k] - a[k]) * t; });
  return o;
}
export const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
