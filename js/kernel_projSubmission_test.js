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
  if (dispose) {
    dispose()
  };

  dispose = setup();
};

function setup() {
  let disposed = false;
  const gpu = new GPU({ mode: gpuEnabled.checked ? 'gpu' : 'cpu' });

  gpu
    .addFunction(calcDistance)
    .addFunction(calcFactor);

  // base kernel with frame
  const kernelBase = gpu.createKernel(
    function (frame) {
      const pixel = frame[this.thread.y][this.thread.x];
      return pixel;
    }, {
    output: [1024, 768],
    pipeline: true,
  }
  );

  // final kernel for video 
  const kernelOutput = gpu.createKernel(
    function (frame) {
      const pixel = frame[this.thread.y][this.thread.x];
      this.color(pixel.r, pixel.g, pixel.b, pixel.a);
    }, {
    // LEAVE these
    output: [1024, 768],
    graphical: true,
    tactic: 'precision'
  }
  );

  // kernel for Green World
  const kernel1 = gpu.createKernel(
    function (frame) {
      const pixel = frame[this.thread.y][this.thread.x];
      pixel.r = 0;
      pixel.b = 0;
      return pixel;
    }, {
    // LEAVE these
    output: [1024, 768],
    pipeline: true,
  }
  );

  // kernel for Inverted Color 
  const kernel2 = gpu.createKernel(
    function (frame) {
      const pixel = frame[this.thread.y][this.thread.x];
      pixel.r = 1 - pixel.r;
      pixel.g = 1 - pixel.g;
      pixel.b = 1 - pixel.b;
      return pixel;
    }, {
    // LEAVE these
    output: [1024, 768],
    pipeline: true,
  }
  );

  // kernel for Mouse Over 
  const kernel3 = gpu.createKernel(
    function (frame, mX) {
      const pixel = frame[this.thread.y][this.thread.x];

      if (mX <= 256) {
        // do nothing
      } else if (256 < mX && mX <= 512) {
        // red world
        pixel.r = pixel.r;
        pixel.g = 0;
        pixel.b = 0;
      } else if (512 < mX && mX <= 768) {
        // green world
        pixel.r = 0;
        pixel.g = pixel.g;
        pixel.b = 0;
      } else {
        // blue world
        pixel.r = 0;
        pixel.g = 0;
        pixel.b = pixel.b;
      }
      return pixel;
    }, {
    // LEAVE these
    output: [1024, 768],
    pipeline: true,
  }
  );


  // kernel for Peek A Boo 
  const kernel4 = gpu.createKernel(
    function (frame, mX, mY) {
      const pixel = frame[this.thread.y][this.thread.x];
      var dist = calcDistance(mX, mY, this.thread.x, this.thread.y);
      var factor = calcFactor(dist, 300, 0);

      pixel.r = pixel.r * factor;
      pixel.g = pixel.g * factor;
      pixel.b = pixel.b * factor;

      return pixel;
    }, {
    // LEAVE these
    output: [1024, 768],
    pipeline: true,
  }
  );

  // kernel for Gaussian Blur 
  const kernel5 = gpu.createKernel(
    function (frame, k) {
      const pixel = frame[this.thread.y][this.thread.x];
      if (this.thread.y > 0 + 2 && this.thread.y < 768 - 2 && this.thread.x < 1024 - 2 && this.thread.x > 0 + 2) {
        const r1c1 = frame[this.thread.y + 2][this.thread.x - 2];
        const r1c2 = frame[this.thread.y + 2][this.thread.x - 1];
        const r1c3 = frame[this.thread.y + 2][this.thread.x + 0];
        const r1c4 = frame[this.thread.y + 2][this.thread.x + 1];
        const r1c5 = frame[this.thread.y + 2][this.thread.x + 2];

        const r2c1 = frame[this.thread.y + 1][this.thread.x - 2];
        const r2c2 = frame[this.thread.y + 1][this.thread.x - 1];
        const r2c3 = frame[this.thread.y + 1][this.thread.x + 0];
        const r2c4 = frame[this.thread.y + 1][this.thread.x + 1];
        const r2c5 = frame[this.thread.y + 1][this.thread.x + 2];

        const r3c1 = frame[this.thread.y][this.thread.x - 2];
        const r3c2 = frame[this.thread.y][this.thread.x - 1];
        const r3c3 = frame[this.thread.y][this.thread.x + 0];
        const r3c4 = frame[this.thread.y][this.thread.x + 1];
        const r3c5 = frame[this.thread.y][this.thread.x + 2];

        const r4c1 = frame[this.thread.y - 1][this.thread.x - 2];
        const r4c2 = frame[this.thread.y - 1][this.thread.x - 1];
        const r4c3 = frame[this.thread.y - 1][this.thread.x + 0];
        const r4c4 = frame[this.thread.y - 1][this.thread.x + 1];
        const r4c5 = frame[this.thread.y - 1][this.thread.x + 2];

        const r5c1 = frame[this.thread.y - 2][this.thread.x - 2];
        const r5c2 = frame[this.thread.y - 2][this.thread.x - 1];
        const r5c3 = frame[this.thread.y - 2][this.thread.x + 0];
        const r5c4 = frame[this.thread.y - 2][this.thread.x + 1];
        const r5c5 = frame[this.thread.y - 2][this.thread.x + 2];

        var divisor = 0;
        var col = [0, 0, 0];

        for (var j = 0; j < 15; j++) {
          divisor = divisor + k[j];
        }

        for (var i = 0; i < 3; i++) {

          col[i] =
            r1c1[i] * k[0] + r1c2[i] * k[1] + r1c3[i] * k[2] + r1c4[i] * k[3] + r1c5[i] * k[4]
            + r2c1[i] * k[0] + r2c2[i] * k[1] + r2c3[i] * k[2] + r2c4[i] * k[3] + r2c5[i] * k[4]
            + r3c1[i] * k[0] + r3c2[i] * k[1] + r3c3[i] * k[2] + r3c4[i] * k[3] + r3c5[i] * k[4]
            + r4c1[i] * k[0] + r4c2[i] * k[1] + r4c3[i] * k[2] + r4c4[i] * k[3] + r4c5[i] * k[4]
            + r5c1[i] * k[0] + r5c2[i] * k[1] + r5c3[i] * k[2] + r5c4[i] * k[3] + r5c5[i] * k[4];

          col[i] = col[i] / divisor * 2.2;

          pixel.r = col[0];
          pixel.g = col[1];
          pixel.b = col[2];
        }

      }

      return pixel;
    }, {
    // LEAVE these
    output: [1024, 768],
    pipeline: true,
  }
  );

  // append kernel canvas to html to play the video
  canvasParent.appendChild(kernelOutput.canvas);
  const videoElement = document.querySelector('video');



  // *************** BEGIN OF CUSTOM FUNCITONS DEFINITION ***************

  // initialize the canvas and mouse position
  const canvas = kernelOutput.canvas;
  var mouseX = 1024 / 2;
  var mouseY = 768 / 2;

  // compute mouse position in the canvas when cursor move in the video screen
  canvas.addEventListener("mousemove", setMousePosition, false);
  function setMousePosition(e) {
    // console.log("(Before) mouse Y: " + mouseY);
    // console.log("(Before) e.clientY: " + e.clientY);
    // console.log("(Before) canvas.offsetTop: " + canvas.offsetTop);
    mouseX = e.clientX - canvas.offsetLeft;
    mouseY = 768 - (e.clientY - canvas.offsetTop);
    console.log("mouseX: " + mouseX + "  mouse Y: " + mouseY);
  }

  // create filters
  function setFilter(filterValue) {
    var filteredFrame;
    filteredFrame = kernelBase(videoElement);

    if (filterValue == 1) {
      filteredFrame = kernel1(filteredFrame);
    } else if (filterValue == 2) {
      filteredFrame = kernel2(filteredFrame);
    } else if (filterValue == 3) {
      filteredFrame = kernel3(filteredFrame, mouseX);
    } else if (filterValue == 4) {
      filteredFrame = kernel4(filteredFrame, mouseX, mouseY);
    } else if (filterValue == 5) {
      filteredFrame = kernel5(filteredFrame, k_value);
    } else if (filterValue == 6) {

    }
    return filteredFrame;
  }

  // *************** END OF CUSTOM FUNCITONS DEFINITION ***************



  // update video frame 
  function render() {
    if (disposed) {
      return;
    }
    kernelOutput(setFilter(filterValue));
    window.requestAnimationFrame(render);
    calcFPS();
  }
  render();

  // remove video frame from html canvas
  return () => {
    canvasParent.removeChild(kernelOutput.canvas);
    gpu.destroy();
    disposed = true;
  };


}



// IGNORE THESE
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


// Function for Control Flow (checkbox, radio button, slider etc.)
function filterMode(value) {
  // document.getElementById("show-sliders").style.display = "none";
  filterValue = value;
  console.log("filter mode: " + value);
}

// calculate distance using pythagoras theorem
function calcDistance(x1, y1, x2, y2) {
  // return distance between two points using pythagoras theorem
  var a = x2 - x1;
  var b = y2 - y1;
  return Math.sqrt(a * a + b * b);
}

// calcualte factor for mulitplication
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