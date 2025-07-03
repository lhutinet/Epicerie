const canvas = document.getElementById("spiroCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
let var1 = Math.random() * 500;
let var2 = Math.random() * 500;
let var3 = Math.random() * 500;
let var4 = Math.random() * 500;

let time = 0;
const speed = 0.05; // Vitesse de dessin
const R = var1; // Rayon du stator
const r = var2; // Rayon du rotor
const d = var3; // Distance du stylet par rapport au centre du rotor
const fixedColor = "rgba(155, 155, 155, 0.3)"; // Couleur fixe

function drawNonCircularSpirograph(cx, cy, R, r, d, t) {
  ctx.strokeStyle = fixedColor;

  ctx.lineWidth = 1;
  ctx.beginPath();

  for (let theta = 0; theta <= t; theta += 0.01) {
    // Utilisation d'une ellipse au lieu d'un cercle pour le rotor
    const x =
      cx +
      (R - r) * Math.cos(theta) +
      d * Math.cos(((R - r) / r) * theta) * Math.cos(theta);
    const y =
      cy +
      (R - r) * Math.sin(theta) +
      d * Math.sin(((R - r) / r) * theta) * Math.sin(theta);
    if (theta === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.stroke();
}

function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  drawNonCircularSpirograph(cx, cy, R, r, d, time);
  time += speed;
  requestAnimationFrame(animate);
}

animate();
