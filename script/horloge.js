const cercleHoraire = document.getElementById("cercleHoraire");
const canvas = document.createElement("canvas");
canvas.width = 40;
canvas.height = 40;
cercleHoraire.appendChild(canvas);
const ctx = canvas.getContext("2d");

function drawClock() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const now = new Date();
  const hours = now.getHours() % 12;
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();

  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = 18;

  // Draw clock face
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
  ctx.fillStyle = "#a2b61e";
  ctx.fill();
  ctx.strokeStyle = "#a2b61e";
  ctx.stroke();

  function drawHand(angle, length, width, color) {
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(
      centerX + length * Math.cos(angle),
      centerY + length * Math.sin(angle)
    );
    ctx.lineWidth = width;
    ctx.strokeStyle = color;
    ctx.stroke();
  }

  // Draw hands
  drawHand((Math.PI / 6) * hours - Math.PI / 2, radius * 0.5, 2, "white");
  drawHand((Math.PI / 30) * minutes - Math.PI / 2, radius * 0.7, 2, "white");
  drawHand((Math.PI / 30) * seconds - Math.PI / 2, radius * 0.8, 1, "red");
}

setInterval(drawClock, 1000);
drawClock();
