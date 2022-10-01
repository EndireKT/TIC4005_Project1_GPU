
const canvasParent = document.getElementById('canvas-parent');
const filter = document.getElementById('filter');
const gpuEnabled = document.getElementById('gpu-enabled');
const fpsNumber = document.getElementById('fps-number');

let lastCalledTime = Date.now();
let fps;
let delta;
let filterValue = 0;

let k_value =
  [1, 4, 6, 4, 1,
    4, 16, 24, 16, 4,
    6, 24, 36, 24, 6,
    4, 16, 24, 16, 4,
    1, 4, 6, 4, 1];

let k_value2 =
  [0, 0.01, 0.01, 0.01, 0,
    0.01, 0.05, 0.11, 0.05, 0.01,
    0.01, 0.11, 0.25, 0.11, 0.01,
    0.01, 0.05, 0.11, 0.05, 0.01,
    0, 0.01, 0.01, 0.01, 0];

let dispose = setup();
gpuEnabled.onchange = () => {
  if (dispose) dispose();
  dispose = setup();
};

function initializeProgram() {

}



function setup() {
  let disposed = false;

  const gpu = new GPU({ mode: gpuEnabled.checked ? 'gpu' : 'cpu' });

  gpu
    .addFunction(greenWorld)
    .addFunction(invertedColor1)
    .addFunction(mouseOver)
    .addFunction(calcDistance)
    .addFunction(calcFactor)
    .addFunction(peekaboo)
    .addFunction(gaussianBlur);

  // THIS IS THE IMPORTANT STUFF


  canvasParent.appendChild(kernel.canvas);
  const videoElement = document.querySelector('video');

  // initialize the kernel
  kernel(videoElement, filter.checked, filterValue, 0, 0, k_value);

  // initialize the kernel and mouse position
  const canvas = kernel.canvas;
  var mouseX = 1024 / 2;
  var mouseY = 768 / 2;

  // compute mouse position in the canvas when cursor move in the video screen
  canvas.addEventListener("mousemove", setMousePosition, false);

  function setMousePosition(e) {
    console.log("(Before) mouse Y: " + mouseY);
    console.log("(Before) e.clientY: " + e.clientY);
    console.log("(Before) canvas.offsetTop: " + canvas.offsetTop);
    mouseX = e.clientX - canvas.offsetLeft;
    mouseY = 724 - (e.clientY - canvas.offsetTop);
    console.log("mouseX: " + mouseX + "  mouse Y: " + mouseY);
    kernel(videoElement, filter.checked, filterValue, mouseX, mouseY, k_value);
  }

  // render the video
  function render() {
    if (disposed) {
      return;
    }
    kernel(videoElement, filter.checked, filterValue, mouseX, mouseY, k_value);
    window.requestAnimationFrame(render);
    calcFPS();
  }

  render();
  return () => {
    canvasParent.removeChild(kernel.canvas);
    gpu.destroy();
    disposed = true;
  };
}

// ignore this 
function streamHandler(stream) {
  try {
    video.srcObject = stream;
  } catch (error) {
    video.src = URL.createObjectURL(stream);
  }
  video.play();
  console.log("In startStream");
  requestAnimationFrame(render);
}

addEventListener("DOMContentLoaded", initialize);

function calcFPS() {
  delta = (Date.now() - lastCalledTime) / 1000;
  lastCalledTime = Date.now();
  fps = 1 / delta;
  fpsNumber.innerHTML = fps.toFixed(0);
}

// START OF ADDITION FUNCTIONS




// Function for manupulating pixel value

function greenWorld(r, g, b, a) {
  return [0, g, 0, a];
}

function invertedColor1(r, g, b, a) {
  return [1 - r, 1 - g, 1 - b, a];
}

function mouseOver(r, g, b, a, mX) {
  if (mX <= 256) {
    return [r, g, b, a];
  } else if (256 < mX && mX <= 512) {
    return [255, g, b, a];
  } else if (512 < mX && mX <= 768) {
    return [r, 255, b, a];
  } else {
    return [r, g, 255, a];
  }
}

function peekaboo(r, g, b, a, mX, mY) {
  var dist = calcDistance(mX, mY, this.thread.x, this.thread.y);
  var factor = calcFactor(dist, 300, 0);
  return [r * factor, g * factor, b * factor, a]
}

function gaussianBlur(r, g, b, a, r1c1, r1c2, r1c3, r2c1, r2c2, r2c3, r3c1, r3c2, r3c3) {

  // for (var i = 0; i < 3; i++) {       // Compute the convolution for each of red [0], green [1] and blue [2]
  //   r = a0[i] * k[0] + a1[i] * k[1] + a2[i] * k[2] + a3[i] * k[3] + a4[i] * k[4] + a5[i] * k[5] + a6[i] * k[6] + a7[i] * k[7] + a8[i] * k[8];
  // }

  //k = [1, 2, 1, 2, 4, 2, 1, 2, 1];
  // var sometjiog = [0, 2, 3, 4];

  // // // col = [0, 0, 0];
  // // // divisor = 0;

  // // // for (j = 0; j < k.length; j++) {
  // // //   divisor += k[j];
  // // // }

  // // // for (i = 0; i < 3; i++) {
  // // //   col[i] = r1c1[i] * k[0] + r1c2[i] * k[1] + r1c3[i] * k[2]
  // // //     + r2c1[i] * k[3] + r2c2[i] * k[4] + r2c3[i] * k[5]
  // // //   //     + r3c1[i] * k[6] + r3c2[i] * k[7] + r3c3[i] * k[8];
  // // // }

  // // let aaa = k[0];

  // return [r, g, b, a]
}

// Function for calculation 

function calcDistance(x1, y1, x2, y2) {
  // return distance between two points using pythagoras theorem
  var a = x2 - x1;
  var b = y2 - y1;
  return Math.sqrt(a * a + b * b);
}

function calcFactor(dist, maxRange, minRange) {
  // return normalized value between range as a factor between 1 to 0
  if (dist <= minRange) {
    return 1;
  }
  if (dist >= maxRange) {
    return 0;
  }
  return (maxRange - dist - minRange) / (maxRange - minRange);
}




// Function for Control Flow (checkbox, radio button, slider etc.)

function filterMode(value) {
  // document.getElementById("show-sliders").style.display = "none";
  filterValue = value;
  console.log("filter mode: " + value);
}

function filterMode5(value) {
  // document.getElementById("show-sliders").style.display = "block";
  filterValue = value;
  console.log("filter mode: " + value);
}

