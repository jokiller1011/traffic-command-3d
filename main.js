// ================== BASIC SETUP ==================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// ================== LIGHTING ==================
scene.add(new THREE.AmbientLight(0xffffff, 0.6));

const sun = new THREE.DirectionalLight(0xffffff, 0.6);
sun.position.set(10, 20, 10);
scene.add(sun);

// ================== ROAD ==================
const road = new THREE.Mesh(
  new THREE.PlaneGeometry(500, 20),
  new THREE.MeshStandardMaterial({ color: 0x333333 })
);
road.rotation.x = -Math.PI / 2;
scene.add(road);

// Lane lines
for (let i = -1; i <= 1; i++) {
  const line = new THREE.Mesh(
    new THREE.PlaneGeometry(500, 0.2),
    new THREE.MeshStandardMaterial({ color: 0xffffff })
  );
  line.rotation.x = -Math.PI / 2;
  line.position.z = i * 3;
  scene.add(line);
}

// ================== PLAYER CAR ==================
const player = new THREE.Mesh(
  new THREE.BoxGeometry(2, 1, 4),
  new THREE.MeshStandardMaterial({ color: 0xff0000 })
);
player.position.set(0, 0.5, 0);
scene.add(player);

// ================== CAMERA ==================
camera.position.set(0, 6, 12);
camera.lookAt(player.position);

// ================== CONTROLS ==================
let speed = 0;
const maxSpeed = 0.6;
const keys = {};
let gameOver = false;

window.addEventListener("keydown", e => keys[e.key] = true);
window.addEventListener("keyup", e => keys[e.key] = false);

// ================== TRAFFIC AI ==================
const trafficCars = [];
const lanes = [-3, 0, 3];

function spawnTraffic(z) {
  const car = new THREE.Mesh(
    new THREE.BoxGeometry(2, 1, 4),
    new THREE.MeshStandardMaterial({ color: 0x0088ff })
  );
  car.position.set(
    lanes[Math.floor(Math.random() * lanes.length)],
    0.5,
    z
  );
  scene.add(car);
  trafficCars.push(car);
}

for (let i = 1; i <= 12; i++) {
  spawnTraffic(-i * 25);
}

// ================== TRAFFIC LIGHT ==================
let lightState = "green";
let lightTimer = 0;

const lightBox = new THREE.Mesh(
  new THREE.BoxGeometry(1, 3, 1),
  new THREE.MeshStandardMaterial({ color: 0x00ff00 })
);
lightBox.position.set(-6, 1.5, -60);
scene.add(lightBox);

// ================== COLLISION ==================
function checkCollision(a, b) {
  const boxA = new THREE.Box3().setFromObject(a);
  const boxB = new THREE.Box3().setFromObject(b);
  return boxA.intersectsBox(boxB);
}

// ================== GAME LOOP ==================
function animate() {
  requestAnimationFrame(animate);
  if (gameOver) return;

  // ----- Movement -----
  if (keys["w"]) speed = Math.min(speed + 0.01, maxSpeed);
  if (keys["s"]) speed = Math.max(speed - 0.02, -0.2);
  if (!keys["w"] && !keys["s"]) speed *= 0.97;

  if (keys["a"]) player.position.x -= 0.12;
  if (keys["d"]) player.position.x += 0.12;

  // Forward direction FIXED
  player.position.z -= speed;
  camera.position.z = player.position.z + 12;

  // ----- Traffic AI -----
  trafficCars.forEach(ai => {
    ai.position.z += 0.25;

    if (ai.position.z > camera.position.z + 10) {
      ai.position.z = player.position.z - 300;
      ai.position.x = lanes[Math.floor(Math.random() * lanes.length)];
    }

    // Collision
    if (checkCollision(player, ai)) {
      alert("CRASH! Game Over.");
      gameOver = true;
    }
  });

  // ----- Traffic Light Logic -----
  lightTimer += 1;

  if (lightTimer > 300) {
    lightTimer = 0;
    lightState = lightState === "green" ? "red" : "green";
    lightBox.material.color.set(
      lightState === "green" ? 0x00ff00 : 0xff0000
    );
  }

  // Red light violation
  if (
    lightState === "red" &&
    player.position.z < lightBox.position.z + 5 &&
    speed > 0.05
  ) {
    alert("Ran a red light!");
    gameOver = true;
  }

  // ----- UI -----
  document.getElementById("speed").textContent =
    Math.abs(Math.round(speed * 120));

  renderer.render(scene, camera);
}

animate();

// ================== RESIZE ==================
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
