// ================== SETUP ==================
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

// ================== LIGHT ==================
scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const sun = new THREE.DirectionalLight(0xffffff, 0.6);
sun.position.set(10, 20, 10);
scene.add(sun);

// ================== ROAD ==================
const road = new THREE.Mesh(
  new THREE.PlaneGeometry(1000, 20),
  new THREE.MeshStandardMaterial({ color: 0x333333 })
);
road.rotation.x = -Math.PI / 2;
scene.add(road);

// Lane lines
const lanes = [-3, 0, 3];
lanes.forEach(z => {
  const line = new THREE.Mesh(
    new THREE.PlaneGeometry(1000, 0.2),
    new THREE.MeshStandardMaterial({ color: 0xffffff })
  );
  line.rotation.x = -Math.PI / 2;
  line.position.z = z;
  scene.add(line);
});

// ================== PLAYER ==================
const player = new THREE.Mesh(
  new THREE.BoxGeometry(2, 1, 4),
  new THREE.MeshStandardMaterial({ color: 0xff0000 })
);
player.position.set(0, 0.5, 0);
scene.add(player);

// ================== CAMERA ==================
camera.position.set(0, 6, 12);
camera.lookAt(player.position);

// ================== INPUT ==================
let speed = 0;
const maxSpeed = 0.6;
const keys = {};
let gameOver = false;

window.addEventListener("keydown", e => keys[e.key] = true);
window.addEventListener("keyup", e => keys[e.key] = false);

// ================== TRAFFIC ==================
const trafficCars = [];

function spawnTraffic(z) {
  const car = new THREE.Mesh(
    new THREE.BoxGeometry(2, 1, 4),
    new THREE.MeshStandardMaterial({ color: 0x0066ff })
  );
  car.position.set(
    lanes[Math.floor(Math.random() * lanes.length)],
    0.5,
    z
  );
  scene.add(car);
  trafficCars.push(car);
}

// Spawn traffic AHEAD of player
for (let i = 1; i <= 10; i++) {
  spawnTraffic(-i * 40);
}

// ================== COLLISION ==================
function hit(a, b) {
  return new THREE.Box3().setFromObject(a)
    .intersectsBox(new THREE.Box3().setFromObject(b));
}

// ================== GAME LOOP ==================
function animate() {
  requestAnimationFrame(animate);
  if (gameOver) return;

  // --- Player movement ---
  if (keys["w"]) speed = Math.min(speed + 0.01, maxSpeed);
  if (keys["s"]) speed = Math.max(speed - 0.02, 0);
  if (!keys["w"]) speed *= 0.96;

  if (keys["a"]) player.position.x -= 0.12;
  if (keys["d"]) player.position.x += 0.12;

  // Player moves FORWARD (negative Z)
  player.position.z -= speed;
  camera.position.z = player.position.z + 12;

  // --- Traffic movement ---
  trafficCars.forEach(car => {
    car.position.z += 0.3;

    // Respawn far ahead
    if (car.position.z > player.position.z + 30) {
      car.position.z = player.position.z - 400;
      car.position.x = lanes[Math.floor(Math.random() * lanes.length)];
    }

    // Collision
    if (hit(player, car)) {
      gameOver = true;
      document.getElementById("ui").innerHTML +=
        "<h2 style='color:red'>GAME OVER</h2>";
    }
  });

  document.getElementById("speed").textContent =
    Math.round(speed * 120);

  renderer.render(scene, camera);
}

animate();

// ================== RESIZE ==================
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
