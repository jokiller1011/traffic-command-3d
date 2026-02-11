// =====================
// BASIC SETUP
// =====================
import * as THREE from "three";

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

// =====================
// LIGHTING
// =====================
scene.add(new THREE.AmbientLight(0xffffff, 0.6));

const sun = new THREE.DirectionalLight(0xffffff, 0.8);
sun.position.set(50, 100, 50);
scene.add(sun);

// =====================
// ROAD
// =====================
const road = new THREE.Mesh(
  new THREE.PlaneGeometry(20, 1000),
  new THREE.MeshStandardMaterial({ color: 0x333333 })
);
road.rotation.x = -Math.PI / 2;
scene.add(road);

// Lane lines
for (let i = -500; i < 500; i += 20) {
  const line = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 0.01, 5),
    new THREE.MeshStandardMaterial({ color: 0xffffff })
  );
  line.position.set(0, 0.01, i);
  scene.add(line);
}

// =====================
// PLAYER VEHICLE
// =====================
const player = new THREE.Mesh(
  new THREE.BoxGeometry(1.8, 1, 4),
  new THREE.MeshStandardMaterial({ color: 0x0077ff })
);
player.position.set(-2, 0.5, 10);
scene.add(player);

camera.position.set(0, 6, 15);
camera.lookAt(player.position);

// =====================
// CONTROLS
// =====================
const keys = {};
window.addEventListener("keydown", e => keys[e.key] = true);
window.addEventListener("keyup", e => keys[e.key] = false);

let speed = 0;
const maxSpeed = 0.35;

// =====================
// TRAFFIC VEHICLES
// =====================
const traffic = [];
const vehicleColors = [0xff0000, 0xffff00, 0xffffff, 0x00ff00];

function spawnTraffic(z) {
  const car = new THREE.Mesh(
    new THREE.BoxGeometry(1.8, 1, 4),
    new THREE.MeshStandardMaterial({
      color: vehicleColors[Math.floor(Math.random() * vehicleColors.length)]
    })
  );

  car.position.set(2, 0.5, z);
  scene.add(car);
  traffic.push(car);
}

for (let i = -50; i > -500; i -= 40) spawnTraffic(i);

// =====================
// TRAFFIC LIGHT
// =====================
const lightPole = new THREE.Mesh(
  new THREE.CylinderGeometry(0.1, 0.1, 4),
  new THREE.MeshStandardMaterial({ color: 0x222222 })
);
lightPole.position.set(-5, 2, -60);
scene.add(lightPole);

const trafficLight = new THREE.Mesh(
  new THREE.BoxGeometry(0.6, 1.6, 0.6),
  new THREE.MeshStandardMaterial({ color: 0xff0000 })
);
trafficLight.position.set(-5, 4, -60);
scene.add(trafficLight);

let lightState = "red";
let lightTimer = 0;

// =====================
// GAME STATE
// =====================
let gameOver = false;

// =====================
// GAME LOOP
// =====================
function animate() {
  requestAnimationFrame(animate);
  if (gameOver) return;

  // ===== PLAYER MOVEMENT =====
  if (keys["w"]) speed = Math.min(speed + 0.01, maxSpeed);
  else speed *= 0.95;

  if (keys["a"]) player.position.x -= 0.08;
  if (keys["d"]) player.position.x += 0.08;

  player.position.x = THREE.MathUtils.clamp(player.position.x, -6, 0);
  player.position.z -= speed;

  camera.position.z = player.position.z + 15;
  camera.lookAt(player.position);

  // ===== TRAFFIC LIGHT LOGIC =====
  lightTimer += 0.016;

  if (lightState === "red" && lightTimer > 5) {
    lightState = "green";
    trafficLight.material.color.set(0x00ff00);
    lightTimer = 0;
  } else if (lightState === "green" && lightTimer > 6) {
    lightState = "yellow";
    trafficLight.material.color.set(0xffff00);
    lightTimer = 0;
  } else if (lightState === "yellow" && lightTimer > 2) {
    lightState = "red";
    trafficLight.material.color.set(0xff0000);
    lightTimer = 0;
  }

  // ===== RED LIGHT VIOLATION =====
  if (
    lightState === "red" &&
    player.position.z < -55 &&
    player.position.z > -65 &&
    speed > 0.05
  ) {
    endGame("You ran a red light!");
  }

  // ===== TRAFFIC MOVEMENT =====
  traffic.forEach(car => {
    car.position.z += 0.25;

    if (car.position.z > player.position.z + 50) {
      car.position.z = player.position.z - 400;
    }

    // COLLISION
    if (car.position.distanceTo(player.position) < 2.5) {
      endGame("You crashed!");
    }
  });

  renderer.render(scene, camera);
}

// =====================
// GAME OVER
// =====================
function endGame(reason) {
  gameOver = true;
  console.log(reason);
  document.body.innerHTML += `<h1 style="position:fixed;top:40%;width:100%;text-align:center;color:red;">GAME OVER<br>${reason}</h1>`;
}

animate();
