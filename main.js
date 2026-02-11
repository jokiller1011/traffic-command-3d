// =======================
// BASIC SETUP
// =======================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  2000
);

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
// ROAD (INFINITE)
// =======================
const roadSegments = [];

function createRoad(z) {
  const road = new THREE.Mesh(
    new THREE.BoxGeometry(ROAD_WIDTH, 0.1, SEGMENT_LENGTH),
    new THREE.MeshStandardMaterial({ color: 0x222222 })
  );
  road.position.z = z;
  scene.add(road);
  roadSegments.push(road);
}

for (let i = 0; i < 6; i++) {
  createRoad(i * SEGMENT_LENGTH);
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
const ACCEL = 0.01;
const BRAKE = 0.02;

function updatePlayer() {
  if (keys["w"]) speed = Math.min(MAX_SPEED, speed + ACCEL);
  else speed = Math.max(0, speed - 0.006);

  if (keys["s"]) speed = Math.max(0, speed - BRAKE);

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
  car.userData.speed = 0.2;

  scene.add(car);
  traffic.push(car);
}

setInterval(spawnTraffic, 2500);

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

  // traffic light
  const light = new THREE.Mesh(
    new THREE.BoxGeometry(0.6, 2, 0.6),
    new THREE.MeshStandardMaterial({ color: 0x00ff00 })
  );
  light.position.set(5, 1, z);

  const data = {
    light,
    state: "green",
    timer: 0,
    stopZ: z - 5
  };

  scene.add(light);
  intersections.push(data);
}

// =======================
// LIGHT LOGIC
// =======================
function updateIntersections(delta) {
  intersections.forEach(i => {
    i.timer += delta;

    if (i.timer > 5) {
      i.timer = 0;
      i.state = i.state === "green" ? "red" : "green";
      i.light.material.color.set(
        i.state === "green" ? 0x00ff00 : 0xff0000
      );
    }

    // stop PLAYER only on red
    if (
      i.state === "red" &&
      player.position.z < i.stopZ &&
      player.position.z + speed >= i.stopZ
    ) {
      speed = 0;
    }

    // stop AI traffic
    traffic.forEach(car => {
      if (
        i.state === "red" &&
        car.position.z < i.stopZ &&
        car.position.z + car.userData.speed >= i.stopZ
      ) {
        car.userData.speed = 0;
      } else {
        car.userData.speed = 0.2;
      }
    });
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

  // camera follow
  camera.position.z = player.position.z - 10;
  camera.lookAt(player.position);

  // infinite road recycle
  roadSegments.forEach(r => {
    if (r.position.z + SEGMENT_LENGTH < player.position.z) {
      r.position.z += SEGMENT_LENGTH * roadSegments.length;
    }
  });

  // AI traffic movement
  traffic.forEach(car => {
    car.position.z -= car.userData.speed;
  });

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
