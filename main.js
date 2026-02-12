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
// ROAD
// =======================
const roadSegments = [];
function createRoad(z) {
  const r = new THREE.Mesh(
    new THREE.BoxGeometry(ROAD_WIDTH, 0.1, SEGMENT_LENGTH),
    new THREE.MeshStandardMaterial({ color: 0x222222 })
  );
  r.position.z = z;
  scene.add(r);
  roadSegments.push(r);
}
for (let i = 0; i < 6; i++) createRoad(i * SEGMENT_LENGTH);

// =======================
// VEHICLES DEFINITIONS
// =======================
const VEHICLES = {
  car:        { size: [1.8, 1, 3],  color: 0xff0000, maxSpeed: 0.38 },
  suv:        { size: [2.2, 1.2, 3.6], color: 0x00aa00, maxSpeed: 0.34 },
  bus:        { size: [2.5, 1.5, 6], color: 0xffff00, maxSpeed: 0.28 },
  ambulance: { size: [2, 1.3, 4], color: 0xffffff, maxSpeed: 0.36 },
  semi:       { size: [2.8, 1.6, 7], color: 0x5555ff, maxSpeed: 0.25 }
};

let player;
let currentVehicle = "car";

// =======================
// SPAWN PLAYER
// =======================
function spawnPlayer(type) {
  if (player) scene.remove(player);

  const v = VEHICLES[type];
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
// PLAYER MOVEMENT
// =======================
let laneIndex = 1;
let targetX = LANES[laneIndex];
let speed = 0;

function updatePlayer() {
  if (keys["w"]) speed = Math.min(player.userData.maxSpeed, speed + 0.01);
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
// VEHICLE SWITCH (1–5)
// =======================
window.addEventListener("keydown", e => {
  const map = { "1": "car", "2": "suv", "3": "bus", "4": "ambulance", "5": "semi" };
  if (map[e.key]) {
    speed = 0;
    currentVehicle = map[e.key];
    spawnPlayer(currentVehicle);
  }
});

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
// COLLISION
// =======================
const playerBox = new THREE.Box3();
function checkCollisions() {
  playerBox.setFromObject(player);
  for (const car of traffic) {
    const box = new THREE.Box3().setFromObject(car);
    if (playerBox.intersectsBox(box)) {
      alert("Game Over");
      location.reload();
    }
  }
}

// =======================
// GAME LOOP
// =======================
function animate() {
  requestAnimationFrame(animate);

  updatePlayer();
  checkCollisions();

  traffic.forEach(car => {
    car.position.z -= car.userData.speed;
  });

  camera.position.z = player.position.z - 12;
  camera.lookAt(player.position);

  roadSegments.forEach(r => {
    if (r.position.z + SEGMENT_LENGTH < player.position.z) {
      r.position.z += SEGMENT_LENGTH * roadSegments.length;
    }
  });

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
