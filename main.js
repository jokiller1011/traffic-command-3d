// ===== BASIC SETUP =====
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

// ===== LIGHTING =====
scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const sun = new THREE.DirectionalLight(0xffffff, 0.6);
sun.position.set(5, 10, 5);
scene.add(sun);

// ===== ROAD =====
const road = new THREE.Mesh(
  new THREE.BoxGeometry(12, 0.1, 500),
  new THREE.MeshStandardMaterial({ color: 0x222222 })
);
road.rotation.y = 0; // 🔥 FIXED DIRECTION
scene.add(road);

// ===== LANE LINES =====
for (let i = -250; i < 250; i += 10) {
  const line = new THREE.Mesh(
    new THREE.BoxGeometry(0.1, 0.01, 5),
    new THREE.MeshStandardMaterial({ color: 0xffffff })
  );
  line.position.set(0, 0.06, i);
  scene.add(line);
}

// ===== PLAYER (RED CAR) =====
const player = new THREE.Mesh(
  new THREE.BoxGeometry(1.8, 1, 3),
  new THREE.MeshStandardMaterial({ color: 0xff0000 })
);
player.position.set(2, 0.55, 0); // RIGHT LANE
scene.add(player);

// ===== CAMERA =====
camera.position.set(0, 6, -10);
camera.lookAt(player.position);

// ===== TRAFFIC (BLUE CARS) =====
const traffic = [];

function spawnTraffic() {
  const car = new THREE.Mesh(
    new THREE.BoxGeometry(1.8, 1, 3),
    new THREE.MeshStandardMaterial({ color: 0x0044ff })
  );

  car.position.set(-2, 0.55, player.position.z + 60); // OPPOSITE LANE
  scene.add(car);
  traffic.push(car);
}
setInterval(spawnTraffic, 2500);

// ===== TRAFFIC LIGHT =====
const lightPole = new THREE.Mesh(
  new THREE.CylinderGeometry(0.1, 0.1, 4),
  new THREE.MeshStandardMaterial({ color: 0x333333 })
);
lightPole.position.set(-5, 2, 40);
scene.add(lightPole);

const lightColors = {
  red: new THREE.Color(0xff0000),
  yellow: new THREE.Color(0xffff00),
  green: new THREE.Color(0x00ff00),
};

const trafficLight = new THREE.Mesh(
  new THREE.BoxGeometry(0.6, 1.5, 0.6),
  new THREE.MeshStandardMaterial({ color: lightColors.green })
);
trafficLight.position.set(-5, 4, 40);
scene.add(trafficLight);

let lightState = "green";

setInterval(() => {
  if (lightState === "green") {
    lightState = "yellow";
    trafficLight.material.color = lightColors.yellow;
  } else if (lightState === "yellow") {
    lightState = "red";
    trafficLight.material.color = lightColors.red;
  } else {
    lightState = "green";
    trafficLight.material.color = lightColors.green;
  }
}, 4000);

// ===== MOVEMENT =====
let speed = 0.15;

function animate() {
  requestAnimationFrame(animate);

  // PLAYER
  player.position.z += speed;
  camera.position.z = player.position.z - 10;
  camera.lookAt(player.position);

  // TRAFFIC
  traffic.forEach(car => {
    const distanceToLight = trafficLight.position.z - car.position.z;

    if (lightState === "red" && distanceToLight > -2 && distanceToLight < 8) {
      return; // STOP AT RED
    }

    car.position.z -= 0.2;
  });

  renderer.render(scene, camera);
}

animate();

// ===== RESIZE =====
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
