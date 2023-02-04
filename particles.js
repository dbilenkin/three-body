///////////////////////////
//GLOBAL VARIABLES
///////////////////////////
Number.prototype.mod = function (n) {
  return ((this % n) + n) % n;
};

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const numBodiesDisplay = document.getElementById("numBodies");
numBodiesDisplay.innerHTML = 0;

const width = 800;
const height = 600;

let cameraOffset = { x: width / 2, y: height / 2 };
let isDragging = false;
let dragStart = { x: 0, y: 0 };
let cameraZoom = 1;
let currentScale = 1;
let MAX_ZOOM = 5;
let MIN_ZOOM = 0.1;
let SCROLL_SENSITIVITY = 0.00005
let speed = 1;
let drawSpeed = 10;
let then = Date.now();

let particles = [];
let numStars = 1000;
let stars = [];

const centerx = width / 2;
const centery = height / 2;
let centerOn = true;

let numParticles = 2;
let universeSize = .3;
let maxSize = 20;
let minSize = 5;
let merge = false;
const viscosity = 1;
const maxSpeed = .3;

let trailsOn = true;
let trailLength = 1;
let g = .1 * speed * speed;
let gSpeedAdj = 1 / Math.sqrt(.001 / g);

let step = 0;
const cycle = 1000;
let flying = true;

const trailsCheckbox = document.getElementById("trailsCheckbox");
const trailSlider = document.getElementById("trailLength");

function toggleTrails(toggle = true) {
  trailsOn = toggle;
  trailsCheckbox.checked = toggle;
  if (!trailsOn) {
    trailSlider.value = 0;
  }
}

const mergeCheckbox = document.getElementById("mergeCheckbox");

function toggleMerge(toggle) {
  merge = toggle;
  mergeCheckbox.checked = toggle;
}

function createStarryBackground() {
  for (let i = 0; i < numStars; i++) {
    const luminosity = Math.random();
    const color = getRandomColor(50, luminosity);
    const size = Math.random() + 1;
    const x = Math.random() * width;
    const y = Math.random() * height;
    stars.push({
      color,
      size,
      x,
      y
    })
  }
}

function createOrbit(bodies, d, v) {
  for (let body of bodies) {
    body.x = centerx;
    body.y = centery;
    body.oldx = [];
    body.oldy = [];
    body.speedX = 0;
    body.speedY = 0;
  }

  bodies[1].x = centerx + d;
  bodies[1].speedY = v;

  particles = [...bodies];
}

const sun = {
  size: 865.37,
  mass: 198900000
}

const earth = {
  size: 7.91,
  mass: 597,
  color: 'skyblue'
};

const moon = {
  size: 2.16,
  mass: 7,
  color: 'lightgray'
}

const pluto = {
  size: 14.76,
  mass: 1309,
  color: 'lightgray'

}

const charon = {
  size: 7.53,
  mass: 158,
  color: 'lightblue'
}

function createEarlySolarSystem() {
  toggleTrails(false);
  toggleMerge(true);

  centerOn = false;
  cameraZoom = .5;
  universeSize = 2;
  numParticles = 1000;
  maxSize = 3;
  minSize = .1;
  drawSpeed = 10;
  g = .01 * speed * speed;
  gSpeedAdj = 1 / Math.sqrt(.1 / g);
  createParticles();
  // universeSize = 1;
  // createParticles();

  for (let p of particles) {
    const speedX = gSpeedAdj * 300 * (centery - p.y) / Math.pow(getDistance(p, { x: centerx, y: centery }), 1.5);
    // const speedX = 0;
    const speedY = gSpeedAdj * 300 * (p.x - centerx) / Math.pow(getDistance(p, { x: centerx, y: centery }), 1.5);
    // const speedY = 0;
    p.speedX = speedX;
    p.speedY = speedY;
  }

  // sun
  const sunGrad = ctx.createRadialGradient(centerx, centery, 10, centerx, centery, 30);
  sunGrad.addColorStop(0, "yellow");
  sunGrad.addColorStop(0.3, "yellow");
  sunGrad.addColorStop(0.4, "rgba(255, 255, 0, 0.5)");
  sunGrad.addColorStop(1, "rgba(255, 255, 0, 0)");

  particles[0] = {
    color: sunGrad,
    size: 100,
    mass: 1000000,
    x: centerx,
    y: centery,
    oldx: [],
    oldy: [],
    speedX: 0,
    speedY: 0
  }

}

function createSunEarth() {
  cameraZoom = .003;
  particles.length = 2;
  earthSpeed = 450 * speed * gSpeedAdj;
  createOrbit([sun, earth], 93000, earthSpeed);
}

function createEarthMoon() {
  g = 10 * speed * speed;
  gSpeedAdj = .065 / Math.sqrt(.001 / g);
  particles.length = 2;
  moonSpeed = .78 * speed * gSpeedAdj;
  createOrbit([earth, moon], 238.9, moonSpeed);
}

function createPlutoCharon() {
  g = 1 * speed * speed;
  gSpeedAdj = 1 / Math.sqrt(.001 / g);
  cameraZoom = 2;
  particles.length = 2;
  charonSpeed = .11 * speed * gSpeedAdj;
  createOrbit([pluto, charon], 122, charonSpeed);
}

function create2Bodies() {
  g = .0001 * speed * speed;
  gSpeedAdj = 1 / Math.sqrt(.001 / g);
  particles[0] = {
    color: 'yellow',
    size: 100,
    mass: 1000000,
    x: centerx,
    y: centery,
    oldx: [],
    oldy: [],
    speedX: 0,
    speedY: 0
  };

  particles[1] = {
    color: 'blue',
    size: 5,
    mass: 125,
    x: centerx + 200,
    y: centery,
    oldx: [],
    oldy: [],
    speedX: 0,
    speedY: .5
  }
}

function getRandomColor(lightness = 100, a = 1) {
  const n = 255 - lightness;
  const r = Math.random() * lightness + n;
  const g = Math.random() * lightness + n;
  const b = Math.random() * lightness + n;

  return `rgb(${r}, ${g}, ${b}, ${a}`;
}

function createParticles() {
  for (let i = 0; i < numParticles; i++) {
    const color = getRandomColor(200);
    const size = Math.random() * maxSize + minSize;
    const mass = size * size * size;
    const x = Math.random() * width * universeSize - width * (universeSize - 1) / 2;
    const y = Math.random() * height * universeSize - height * (universeSize - 1) / 2;
    const speedX = gSpeedAdj * Math.random() * maxSpeed;
    const speedY = gSpeedAdj * Math.random() * maxSpeed;
    const oldx = [];
    const oldy = [];
    particles.push({
      color,
      size,
      mass,
      x,
      y,
      oldx,
      oldy,
      speedX,
      speedY
    });
  }
}

function getCenterOfGravity() {
  let x = 0;
  let y = 0;
  let totalMass = particles.reduce((acc, curr) => acc + curr.mass, 0);

  for (let p of particles) {
    x += (p.x - centerx) * p.mass / totalMass;
    y += (p.y - centery) * p.mass / totalMass;
  }

  return { x, y };
}

function draw() {
  if (!flying) return;
  requestAnimationFrame(draw);
  numBodiesDisplay.innerHTML = particles.length;
  step++;
  const now = Date.now();
  if (then + drawSpeed > now) {
    return;
  }
  then = now;

  ctx.translate(width / 2, height / 2);
  ctx.scale(cameraZoom, cameraZoom);
  ctx.translate(-width / 2, -height / 2);

  const clearScale = Math.min(1, currentScale);

  ctx.clearRect(-width / clearScale / 2, -height / clearScale / 2, width * 2 / clearScale, height * 2 / clearScale);
  currentScale = ctx.getTransform().a;


  for (let i = 0; i < particles.length; i++) {
    const particle1 = particles[i];
    let newSpeedX = 0;
    let newSpeedY = 0;
    for (let j = 0; j < particles.length; j++) {

      const particle2 = particles[j];

      const dist = getDistance(particle1, particle2);
      const dist2 = getDistance2(particle1, particle2);
      const touching = dist < (particle1.size + particle2.size) / 2;
      const F = g * particle1.mass * particle2.mass / (dist ** 2);
      if (!touching) {
        const xDist = (particle2.x - particle1.x) / dist;
        const yDist = (particle2.y - particle1.y) / dist;
        newSpeedX += F * xDist / particle1.mass;
        newSpeedY += F * yDist / particle1.mass;
      } else if (j !== 0 && dist !== 0 && merge) { //merge particles
        //particle1 will absorb particle2
        particle1.size = Math.cbrt(Math.pow(particle1.size, 3) + Math.pow(particle2.size, 3));
        particle1.mass = particle1.mass + particle2.mass;
        newSpeedX += particle2.speedX / particle1.mass;
        newSpeedY += particle2.speedY / particle1.mass;
        particles.splice(j, 1);
      }

    }
    particle1.speedX = particle1.speedX * viscosity + newSpeedX //* Math.min(1, maxSpeed / Math.abs(newSpeedX));
    particle1.speedY = particle1.speedY * viscosity + newSpeedY //* Math.min(1, maxSpeed / Math.abs(newSpeedY));
  }

  const { x, y } = getCenterOfGravity();

  if (trailsOn) {
    for (let p of particles) {
      drawtrails(p);
    }
  }

  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    if (p.oldx.length >= (trailLength * 255)) {
      p.oldx.shift();
      p.oldy.shift();
    }
    p.oldx.push(p.x);
    p.oldy.push(p.y);
    p.x = p.x + p.speedX - x;
    p.y = p.y + p.speedY - y;

    drawParticle(p);
  }

  if (centerOn) drawCenter();
  // drawStars();

  if (!flying) return;
  cameraZoom = 1;
}

function getDistance(particle1, particle2) {
  return Math.sqrt((particle1.x - particle2.x) * (particle1.x - particle2.x) + (particle1.y - particle2.y) * (particle1.y - particle2.y));
}


function getDistance2(p1, p2) {
  return Math.pow(((p1.x - p2.x) ** 2) + ((p1.y - p2.y) ** 2), 1.5);
}
function drawStars() {
  for (let star of stars) {
    ctx.fillStyle = star.color;
    ctx.fillRect(star.x / currentScale, star.y / currentScale, star.size / currentScale, star.size / currentScale);
  }
}

function drawCenter() {
  ctx.fillStyle = "red";
  ctx.beginPath();
  ctx.arc(centerx, centery, 2 / currentScale, 0, 2 * Math.PI);
  ctx.closePath();
  ctx.fill();
}

function drawParticle(particle) {
  ctx.fillStyle = particle.color;
  ctx.beginPath();
  ctx.arc(particle.x, particle.y, particle.size / 2, 0, 2 * Math.PI);
  ctx.closePath();
  ctx.fill();
}

function drawtrails(particle) {
  let i = Math.max(0, particle.oldx.length - trailLength * 255)
  for (; i < particle.oldx.length; i++) {
    const color = Math.max(0, i * trailLength - particle.oldx.length + 255);
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.fillRect(particle.oldx[i] - 1, particle.oldy[i] - 1, 1 / currentScale, 1 / currentScale);
    ctx.closePath();
  }
}

function fly() {
  if (!flying) return;
  draw();
}

function toggleFlying() {
  flying = !flying;
  if (flying) {
    fly();
  }
}

// createWall();
// create2Bodies();
createParticles();
// createEarlySolarSystem();
// createStarryBackground();
// createEarthMoon();
// createPlutoCharon();
// createSunEarth();
fly();

function clear() {
  particles = [];
  cameraZoom = 1;
  currentScale = 1;

  ctx.translate(width / 2, height / 2);
  ctx.scale(cameraZoom, cameraZoom);
  ctx.translate(-width / 2, -height / 2);
}

function reset() {
  clear();
  createParticles();
  fly();
}


////////////// EVENT LISTENERS ////////////////////

function adjustZoom(zoomAmount, zoomFactor) {
  if (!isDragging) {
    if (zoomAmount) {
      cameraZoom += zoomAmount
    }
    else if (zoomFactor) {
      console.log(zoomFactor)
      cameraZoom = zoomFactor * lastZoom
    }

    cameraZoom = Math.min(cameraZoom, MAX_ZOOM)
    cameraZoom = Math.max(cameraZoom, MIN_ZOOM)

    // console.log(zoomAmount);
    currentScale = ctx.getTransform().a;
  }
}

function changeSimulation(e) {
  clear();
  switch (e.target.value) {
    case "random":
      createParticles();
      break;
    case "earthMoon":
      createEarthMoon();
      break;
    case "plutoCharon":
      createPlutoCharon();
      break;
    case "solarSystem":
      createEarlySolarSystem();
      break;

    default:
      break;
  }
  fly();
}

function changeNumBodies(e) {
  clear();
  numParticles = parseInt(e.target.value);
  createParticles();
  fly();
}

const simulationDropdown = document.getElementById("simulations");
simulationDropdown.addEventListener("change", changeSimulation);

const numBodiesInput = document.getElementById("numBodiesInput");
numBodiesInput.addEventListener("blur", changeNumBodies);

mergeCheckbox.addEventListener("click", () => merge = !merge);

canvas.addEventListener('wheel', (e) => adjustZoom(e.deltaY * SCROLL_SENSITIVITY));

const slider = document.getElementById("speedRange");
slider.oninput = function () {
  drawSpeed = 100 / parseInt(this.value)
}

trailsCheckbox.addEventListener("click", () => trailsOn = !trailsOn);

trailSlider.oninput = function () {
  trailLength = parseInt(this.value);
}

