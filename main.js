// =======================
// BASIC SETUP
// =======================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 3000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// =======================
// LIGHTING
// =======================
scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const sun = new THREE.DirectionalLight(0xffffff, 0.7);
sun.position.set(5, 12, -5);
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
const SEGMENT_LENGTH = 120;
const LANES = [-2.5, 0, 2.5];

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

  for (let i = 0; i < 12; i++) {
    const stripe = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.02, 5),
      new THREE.MeshStandardMaterial({ color: 0xffffff })
    );
    stripe.position.set(0, 0.06, z - SEGMENT_LENGTH / 2 + i * 10);
    scene.add(stripe);
    stripes.push(stripe);
  }
}

for (let i = 0; i < 6; i++) createRoadSegment(i * SEGMENT_LENGTH);

// =======================
// VEHICLES
// =======================
const vehicleTypes = {
  car:        { size: [1.8, 1, 3],  color: 0xff0000, maxSpeed: 0.38 },
  suv:        { size: [2.1, 1.2, 3.6], color: 0x00aa00, maxSpeed: 0.34 },
  bus:        { size: [2.4, 1.5, 6], color: 0xffff00, maxSpeed: 0.28 },
  ambulance: { size: [2, 1.3, 4], color: 0xffffff, maxSpeed: 0.36 },
  semi:       { size: [2.6, 1.6, 7], color: 0x5555ff, maxSpeed: 0.25 }
};

let player;
let currentVehicle = "car";

function spawnPlayer(type) {
  if (player) scene.remove(player);

  const v = vehicleTypes[type];
  player = new THREE.Mesh(
    new THREE.BoxGeometry(...v.size),
    new THREE.MeshStandardMaterial({ color: v.color })
  );
  player.position.set(0, 0.6, 0);
  player.userData.maxSpeed = v.maxSpeed;
  scene.add(player);
}

spawnPlayer("car");

// =======================
// CAMERA
// =======================
camera.position.set(0, 7, -12);
camera.lookAt(0, 0, 0);

// =======================
// PLAYER MOVEMENT (FIXED CONTROLS)
// =======================
let laneIndex = 1;
let targetX = LANES[laneIndex];
let speed = 0;

function updatePlayer() {
  if (keys["w"]) speed = Math.min(player.userData.maxSpeed, speed + 0.01);
  else speed = Math.max(0, speed - 0.006);

  if (keys["s"]) speed = Math.max(0, speed - 0.03);

  // A = LEFT, D = RIGHT (FIXED)
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
// VEHICLE SWITCH (1–5)
// =======================
window.addEventListener("keydown", e => {
  const map = { "1": "car", "2": "suv", "3": "bus", "4": "ambulance", "5": "semi" };
  if (map[e.key]) {
    currentVehicle = map[e.key];
    speed = 0;
    spawnPlayer(currentVehicle);
  }
});

// =======================
// INTERSECTIONS + VISIBLE TRAFFIC LIGHTS
// =======================
const intersections = [];

function spawnIntersection(z) {
  const cross = new THREE.Mesh(
    new THREE.BoxGeometry(36, 0.12, 10),
    new THREE.MeshStandardMaterial({ color: 0x333333 })
  );
  cross.position.set(0, 0.05, z);
  scene.add(cross);

  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.18, 5),
    new THREE.MeshStandardMaterial({ color: 0x444444 })
  );
  pole.position.set(ROAD_WIDTH / 2 - 1, 2.5, z);
  scene.add(pole);

  const light = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 2.2, 0.6),
    new THREE.MeshStandardMaterial({
      color: 0x00ff00,
      emissive: 0x00ff00
    })
  );
  light.position.set(ROAD_WIDTH / 2 - 1, 5.2, z);
  scene.add(light);

  intersections.push({
    light,
    state: "green",
    timer: 0,
    stopZ: z - 7
  });
}

// =======================
// LIGHT LOGIC
// =======================
function updateLights(delta) {
  intersections.forEach(i => {
    i.timer += delta;
    if (i.timer > 5) {
      i.timer = 0;
      i.state = i.state === "green" ? "red" : "green";
      const c = i.state === "green" ? 0x00ff00 : 0xff0000;
      i.light.material.color.set(c);
      i.light.material.emissive.set(c);
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
let nextIntersectionZ = 140;

function animate(time) {
  requestAnimationFrame(animate);
  const delta = (time - lastTime) / 1000;
  lastTime = time;

  updatePlayer();
  updateLights(delta);

  camera.position.z = player.position.z - 12;
  camera.lookAt(player.position);

  roadSegments.forEach(r => {
    if (r.position.z + SEGMENT_LENGTH < player.position.z) {
      r.position.z += SEGMENT_LENGTH * roadSegments.length;
    }
  });

  if (player.position.z > nextIntersectionZ) {
    spawnIntersection(nextIntersectionZ);
    nextIntersectionZ += 180;
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
