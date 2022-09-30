
const canvasParent = document.getElementById('canvas-parent');
const filter = document.getElementById('filter');
const gpuEnabled = document.getElementById('gpu-enabled');
const fpsNumber = document.getElementById('fps-number');

let lastCalledTime = Date.now();
let fps;
let delta;
let filterValue = 0;

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
    .addFunction(calcFactor)
    .addFunction(peekaboo);

  // THIS IS THE IMPORTANT STUFF
  const kernel = gpu.createKernel(

    function (frame, filter, filterValue, mX, mY) {
      const pixel = frame[this.thread.y][this.thread.x];

      var r = pixel[0];
      var g = pixel[1];
      var b = pixel[2];
      var a = pixel[3];
      var result = [r, g, b, a];

      if (filterValue == 1) {
        result = greenWorld(r, g, b, a);

      } else if (filterValue == 2) {
        result = invertedColor1(r, g, b, a);

      } else if (filterValue == 3) {
        result = mouseOver(r, g, b, a, mX);

      } else if (filterValue == 4) {
        result = peekaboo(r, g, b, a, mX, mY);

      } else if (filterValue == 5) {


      } else {
        result = [r, g, b, a];

      }

      this.color(result[0], result[1], result[2], result[3]);

    }, {
    // LEAVE these
    output: [1024, 768],
    graphical: true,
    tactic: 'precision'
  }
  );

  canvasParent.appendChild(kernel.canvas);
  const videoElement = document.querySelector('video');

  // initialize the kernel
  kernel(videoElement, filter.checked, filterValue, 0, 0);

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
    kernel(videoElement, filter.checked, filterValue, mouseX, mouseY);
  }

  // render the video
  function render() {
    if (disposed) {
      return;
    }
    kernel(videoElement, filter.checked, filterValue, mouseX, mouseY);
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

