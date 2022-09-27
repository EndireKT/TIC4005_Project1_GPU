
const canvasParent = document.getElementById('canvas-parent');
const weirdFilter = document.getElementById('weird-filter');
const gpuEnabled = document.getElementById('gpu-enabled');
const fpsNumber = document.getElementById('fps-number');

let lastCalledTime = Date.now();
let fps;
let delta;
let dispose = setup();
gpuEnabled.onchange = () => {
  if (dispose) dispose();
  dispose = setup();
};


function setup() {
  let disposed = false;

  const gpu = new GPU({ mode: gpuEnabled.checked ? 'gpu' : 'cpu' });

  gpu
    .addFunction(greenWorld)
    .addFunction(invertedColor1)
    .addFunction(mouseOver)
    .addFunction(calcDistance)
    .addFunction(calcFactor);

  // THIS IS THE IMPORTANT STUFF
  const kernel = gpu.createKernel(
    function (frame, weirdFilter, mX, mY) {
      const pixel = frame[this.thread.y][this.thread.x];
      if (weirdFilter) {

        var r = pixel[0];
        var g = pixel[1];
        var b = pixel[2];
        var a = pixel[3];

        const result = mouseOver(r, g, b, a, mX);
        this.color(result[0], result[1], result[2], result[3]);

        // var dist = calcDistance(mX, mY, this.thread.x, this.thread.y);
        // var factor = calcFactor(dist, 1024, 0, 1, 0);
        // this.color(pixel.r * factor, pixel.g * factor, pixel.b * factor, pixel.a);

      } else {
        this.color(pixel.r, pixel.g, pixel.b, pixel.a);
      }
    }, {
    // LEAVE these
    output: [1024, 768],
    graphical: true,
    tactic: 'precision'
  }
  );

  // DO NOT TOUCH AFTER THIS (for now...)
  canvasParent.appendChild(kernel.canvas);
  const videoElement = document.querySelector('video');

  kernel(videoElement, weirdFilter.checked, 0, 0);
  const canvas = kernel.canvas;

  var mouseX = 0;
  var mouseY = 0;

  canvas.addEventListener("mousemove", setMousePosition, false);

  function setMousePosition(e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
    console.log("mouseX: " + mouseX + "  mouse Y: " + mouseY);
    kernel(videoElement, weirdFilter.checked, mouseX, mouseY);
  }

  function render() {
    if (disposed) {
      return;
    }
    kernel(videoElement, weirdFilter.checked, mouseX, mouseY);
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

function calcDistance(x1, y1, x2, y2) {
  var a = x1 - x2;
  var b = y1 - y2;
  return Math.sqrt(a * a + b * b);
}

function calcFactor(xValue, maxValue, minValue, maxRange, minRange) {
  var percentage = (xValue - minValue) / (maxValue - minValue);
  return (maxRange - minRange) * percentage + minRange;
}

// Green World Filter Code
/*
        var r = pixel[0];
        var g = pixel[1];
        var b = pixel[2];
        var a = pixel[3];

        const result = greenWorld(r, g, b, a);
        this.color(result[0], result[1], result[2], result[3]);
*/


// Inverted Color 
/*
        var r = pixel[0];
        var g = pixel[1];
        var b = pixel[2];
        var a = pixel[3];

        const result = invertedColor1(r, g, b, a);
        this.color(result[0], result[1], result[2], result[3]);
*/

// Mouse Over 
/*
        var r = pixel[0];
        var g = pixel[1];
        var b = pixel[2];
        var a = pixel[3];

        const result = mouseOver(r, g, b, a, mX);
        this.color(result[0], result[1], result[2], result[3]);
*/