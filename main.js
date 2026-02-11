// ================== BASIC SETUP ==================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

const camera = new THREE.PerspectiveCamera(
  75, window.innerWidth / window.innerHeight, 0.1, 2000
);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// ================== LIGHTING ==================
scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const sun = new THREE.DirectionalLight(0xffffff, 0.6);
sun.position.set(10, 20, 10);
scene.add(sun);

// ================== CONSTANTS ==================
const LANES = [-2, 0, 2];
const ROAD_Y = 0.55;
const SEGMENT_LENGTH = 80;

// ================== PLAYER ==================
const player = new THREE.Mesh(
  new THREE.BoxGeometry(1.8, 1, 3),
  new THREE.MeshStandardMaterial({ color: 0xff0000 })
);
let laneIndex = 1;
player.position.set(LANES[laneIndex], ROAD_Y, 0);
scene.add(player);

// ================== CAMERA ==================
camera.position.set(0, 6, -10);
camera.lookAt(player.position);

// ================== INPUT ==================
const keys = {};
window.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
window.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

// ================== SPEED ==================
let speed = 0;
const MAX_SPEED = 0.4;
const ACCEL = 0.01;
const BRAKE = 0.02;

// ================== ROAD SYSTEM ==================
const segments = [];
let lastSegmentZ = 0;

function createRoadSegment(type) {
  const group = new THREE.Group();

  // ROAD
  const road = new THREE.Mesh(
    new THREE.BoxGeometry(12, 0.1, SEGMENT_LENGTH),
    new THREE.MeshStandardMaterial({ color: 0x222222 })
  );
  road.position.z = lastSegmentZ + SEGMENT_LENGTH / 2;
  group.add(road);

  // LINES
  for (let z = -SEGMENT_LENGTH / 2; z < SEGMENT_LENGTH / 2; z += 8) {
    const line = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.01, 4),
      new THREE.MeshStandardMaterial({ color: 0xffffff })
    );
    line.position.set(0, 0.06, z);
    road.add(line);
  }

  // INTERSECTION / ROUNDABOUT
  if (type !== "straight") {
    const light = createTrafficLight();
    light.position.z = road.position.z - 10;
    group.add(light);
    group.userData.light = light;
  }

  group.userData.type = type;
  group.userData.z = road.position.z;

  scene.add(group);
  segments.push(group);
  lastSegmentZ += SEGMENT_LENGTH;
}

function spawnSegments() {
  while (lastSegmentZ < player.position.z + 400) {
    const r = Math.random();
    if (r < 0.2) createRoadSegment("roundabout");
    else if (r < 0.45) createRoadSegment("intersection");
    else createRoadSegment("straight");
  }
}

// ================== TRAFFIC LIGHT ==================
function createTrafficLight() {
  const g = new THREE.Group();

  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.1, 4),
    new THREE.MeshStandardMaterial({ color: 0x333333 })
  );
  pole.position.y = 2;
  g.add(pole);

  const box = new THREE.Mesh(
    new THREE.BoxGeometry(0.6, 1.5, 0.6),
    new THREE.MeshStandardMaterial({ color: 0x00ff00 })
  );
  box.position.y = 4;
  g.add(box);

  g.userData = {
    state: "green",
    mesh: box,
    timer: 0
  };

  return g;
}

// ================== UPDATE LIGHTS ==================
function updateLights(delta) {
  segments.forEach(seg => {
    const light = seg.userData.light;
    if (!light) return;

    light.userData.timer += delta;

    if (light.userData.timer > 4) {
      light.userData.timer = 0;
      if (light.userData.state === "green") {
        light.userData.state = "yellow";
        light.userData.mesh.material.color.set(0xffff00);
      } else if (light.userData.state === "yellow") {
        light.userData.state = "red";
        light.userData.mesh.material.color.set(0xff0000);
      } else {
        light.userData.state = "green";
        light.userData.mesh.material.color.set(0x00ff00);
      }
    }
  });
}

// ================== LANE CHANGE ==================
let targetX = player.position.x;

function updateLane() {
  if (keys["a"] && laneIndex > 0) {
    laneIndex--;
    keys["a"] = false;
  }
  if (keys["d"] && laneIndex < LANES.length - 1) {
    laneIndex++;
    keys["d"] = false;
  }
  targetX = LANES[laneIndex];
  player.position.x += (targetX - player.position.x) * 0.15;
}

// ================== MOVEMENT ==================
function updateSpeed() {
  if (keys["w"]) speed = Math.min(MAX_SPEED, speed + ACCEL);
  if (keys["s"]) speed = Math.max(0, speed - BRAKE);
}

// ================== STOP AT RED ==================
function obeyLights() {
  segments.forEach(seg => {
    const light = seg.userData.light;
    if (!light) return;

    const dz = light.position.z - player.position.z;
    if (dz > -2 && dz < 10 && light.userData.state === "red") {
      speed = Math.max(0, speed - BRAKE * 2);
    }
  });
}

// ================== MAIN LOOP ==================
let lastTime = performance.now();

function animate(time) {
  requestAnimationFrame(animate);
  const delta = (time - lastTime) / 1000;
  lastTime = time;

  updateSpeed();
  obeyLights();
  updateLane();

  player.position.z += speed;
  camera.position.z = player.position.z - 10;
  camera.lookAt(player.position);

  spawnSegments();
  updateLights(delta);

  renderer.render(scene, camera);
}

animate();

// ================== RESIZE ==================
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
