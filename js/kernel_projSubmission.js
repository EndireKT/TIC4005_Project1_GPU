
const canvasParent = document.getElementById('canvas-parent');
const filter = document.getElementsByName('filter');
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
    function (frame, filterValue, mX, mY) {

      const pixel = frame[this.thread.y][this.thread.x];
      var r = pixel[0];
      var g = pixel[1];
      var b = pixel[2];
      var a = pixel[3];

      if (filterValue == 1) {
        const result = greenWorld(r, g, b, a);
        this.color(result[0], result[1], result[2], result[3]);

      } else if (filterValue == 2) {
        const result = invertedColor1(r, g, b, a);
        this.color(result[0], result[1], result[2], result[3]);

      } else if (filterValue == 3) {
        var dist = calcDistance(mX, mY, this.thread.x, this.thread.y);
        var factor = calcFactor(dist, 200, 500, 1, 0);
        this.color(pixel.r * factor, pixel.g * factor, pixel.b * factor, pixel.a);

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

  canvasParent.appendChild(kernel.canvas);
  const videoElement = document.querySelector('video');
  const canvas = kernel.canvas;
  var mouseX = 1024 / 2;
  var mouseY = 768 / 2;

  canvas.addEventListener("mousemove", setMousePosition, false);

  function setMousePosition(e) {
    mouseX = e.clientX - canvas.offsetLeft;
    mouseY = e.clientY - canvas.offsetTop;
    console.log("mouseX: " + mouseX + "  mouse Y: " + mouseY);
    kernel(videoElement, filter.value, mouseX, mouseY);
  }

  function render() {
    if (disposed) {
      return;
    }
    kernel(videoElement, filter.value, mouseX, mouseY);
    console.log("mouseX: " + mouseX + "  mouse Y: " + mouseY);
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
  var a = x2 - x1;
  var b = y2 - y1;
  return Math.sqrt(a * a + b * b);
}

function calcFactor(xValue, maxValue, minValue, maxRange, minRange) {

  // if (xValue < minValue) {
  //   return minRange;
  // }

  // if (xValue > maxRange) {
  //   return maxRange;
  // }

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