// =======================
// BASIC SETUP
// =======================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// =======================
// LIGHTING
// =======================
scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const sun = new THREE.DirectionalLight(0xffffff, 0.6);
sun.position.set(5, 10, -5);
scene.add(sun);

// =======================
// INPUT
// =======================
const keys = {};
window.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
window.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

// =======================
// CONSTANTS
// =======================
const ROAD_WIDTH = 12;
const SEGMENT_LENGTH = 100;
const LANES = [-2, 0, 2];

// =======================
// ROAD + STRIPES
// =======================
const roadSegments = [];
const stripes = [];

function createRoadSegment(z) {
  const road = new THREE.Mesh(
    new THREE.BoxGeometry(ROAD_WIDTH, 0.1, SEGMENT_LENGTH),
    new THREE.MeshStandardMaterial({ color: 0x222222 })
  );
  road.position.z = z;
  scene.add(road);
  roadSegments.push(road);

  // lane stripes
  for (let i = 0; i < 10; i++) {
    const stripe = new THREE.Mesh(
      new THREE.BoxGeometry(0.15, 0.02, 4),
      new THREE.MeshStandardMaterial({ color: 0xffffff })
    );
    stripe.position.set(0, 0.06, z - SEGMENT_LENGTH / 2 + i * 10);
    scene.add(stripe);
    stripes.push(stripe);
  }
}

for (let i = 0; i < 6; i++) {
  createRoadSegment(i * SEGMENT_LENGTH);
}

// =======================
// PLAYER
// =======================
const player = new THREE.Mesh(
  new THREE.BoxGeometry(1.8, 1, 3),
  new THREE.MeshStandardMaterial({ color: 0xff0000 })
);
player.position.set(0, 0.55, 0);
scene.add(player);

// =======================
// CAMERA
// =======================
camera.position.set(0, 6, -10);
camera.lookAt(player.position);

// =======================
// PLAYER MOVEMENT
// =======================
let laneIndex = 1;
let targetX = LANES[laneIndex];
let speed = 0;
const MAX_SPEED = 0.35;

function updatePlayer() {
  if (keys["w"]) speed = Math.min(MAX_SPEED, speed + 0.01);
  else speed = Math.max(0, speed - 0.006);

  if (keys["s"]) speed = Math.max(0, speed - 0.03);

  if (keys["a"] && laneIndex > 0) {
    laneIndex--;
    keys["a"] = false;
  }
  if (keys["d"] && laneIndex < LANES.length - 1) {
    laneIndex++;
    keys["d"] = false;
  }

  targetX = LANES[laneIndex];
  player.position.x += (targetX - player.position.x) * 0.25;
  player.position.z += speed;
}

// =======================
// AI TRAFFIC
// =======================
const traffic = [];

function spawnTraffic() {
  const car = new THREE.Mesh(
    new THREE.BoxGeometry(1.8, 1, 3),
    new THREE.MeshStandardMaterial({ color: 0x0044ff })
  );

  const lane = LANES[Math.floor(Math.random() * LANES.length)];
  car.position.set(lane, 0.55, player.position.z + 120);
  car.userData.speed = 0.22;

  scene.add(car);
  traffic.push(car);
}

setInterval(spawnTraffic, 2000);

// =======================
// INTERSECTIONS + LIGHTS
// =======================
const intersections = [];

function spawnIntersection(z) {
  // cross road
  const cross = new THREE.Mesh(
    new THREE.BoxGeometry(40, 0.12, 10),
    new THREE.MeshStandardMaterial({ color: 0x333333 })
  );
  cross.position.set(0, 0.05, z);
  scene.add(cross);

  // pole
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.15, 0.15, 4),
    new THREE.MeshStandardMaterial({ color: 0x444444 })
  );
  pole.position.set(5, 2, z);
  scene.add(pole);

  // light head
  const light = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 1.6, 0.6),
    new THREE.MeshStandardMaterial({ color: 0x00ff00 })
  );
  light.position.set(5, 4, z);
  scene.add(light);

  intersections.push({
    light,
    state: "green",
    timer: 0,
    stopZ: z - 6
  });
}

// =======================
// COLLISION
// =======================
const playerBox = new THREE.Box3();

function checkCollisions() {
  playerBox.setFromObject(player);

  for (const car of traffic) {
    const carBox = new THREE.Box3().setFromObject(car);
    if (playerBox.intersectsBox(carBox)) {
      alert("Game Over");
      location.reload();
    }
  }
}

// =======================
// UPDATE LIGHTS
// =======================
function updateIntersections(delta) {
  intersections.forEach(i => {
    i.timer += delta;

    if (i.timer > 5) {
      i.timer = 0;
      i.state = i.state === "green" ? "red" : "green";
      i.light.material.color.set(i.state === "green" ? 0x00ff00 : 0xff0000);
    }

    if (
      i.state === "red" &&
      player.position.z < i.stopZ &&
      player.position.z + speed >= i.stopZ
    ) {
      speed = 0;
    }
  });
}

// =======================
// GAME LOOP
// =======================
let lastTime = performance.now();
let nextIntersectionZ = 120;

function animate(time) {
  requestAnimationFrame(animate);
  const delta = (time - lastTime) / 1000;
  lastTime = time;

  updatePlayer();
  updateIntersections(delta);
  checkCollisions();

  // move AI traffic
  traffic.forEach(car => {
    car.position.z -= car.userData.speed;
  });

  // infinite road recycle
  roadSegments.forEach(r => {
    if (r.position.z + SEGMENT_LENGTH < player.position.z) {
      r.position.z += SEGMENT_LENGTH * roadSegments.length;
    }
  });

  // camera follow
  camera.position.z = player.position.z - 10;
  camera.lookAt(player.position);

  // spawn intersections
  if (player.position.z > nextIntersectionZ) {
    spawnIntersection(nextIntersectionZ);
    nextIntersectionZ += 160;
  }

  renderer.render(scene, camera);
}

animate();

// =======================
// RESIZE
// =======================
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
