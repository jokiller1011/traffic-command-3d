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
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
dirLight.position.set(10, 20, 10);
scene.add(dirLight);

// ===== ROAD =====
const roadGeo = new THREE.PlaneGeometry(200, 20);
const roadMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
const road = new THREE.Mesh(roadGeo, roadMat);
road.rotation.x = -Math.PI / 2;
scene.add(road);

// Lane lines
const lineMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
for (let i = -1; i <= 1; i++) {
  const line = new THREE.Mesh(
    new THREE.PlaneGeometry(200, 0.2),
    lineMat
  );
  line.position.z = i * 3;
  line.rotation.x = -Math.PI / 2;
  scene.add(line);
}

// ===== PLAYER VEHICLE (LOW-POLY) =====
const car = new THREE.Mesh(
  new THREE.BoxGeometry(2, 1, 4),
  new THREE.MeshStandardMaterial({ color: 0xff0000 })
);
car.position.y = 0.5;
scene.add(car);

// ===== CAMERA =====
camera.position.set(0, 5, -10);
camera.lookAt(car.position);

// ===== CONTROLS =====
let speed = 0;
const maxSpeed = 0.5;
const keys = {};

window.addEventListener("keydown", e => keys[e.key] = true);
window.addEventListener("keyup", e => keys[e.key] = false);

// ===== GAME LOOP =====
function animate() {
  requestAnimationFrame(animate);

  if (keys["w"]) speed = Math.min(speed + 0.01, maxSpeed);
  if (keys["s"]) speed = Math.max(speed - 0.02, -maxSpeed / 2);
  if (!keys["w"] && !keys["s"]) speed *= 0.98;

  if (keys["a"]) car.position.x -= 0.1;
  if (keys["d"]) car.position.x += 0.1;

car.position.z -= speed;
camera.position.z = car.position.z + 10;

  document.getElementById("speed").textContent =
    Math.abs(Math.round(speed * 120));

  renderer.render(scene, camera);
}

animate();

// ===== RESIZE =====
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
