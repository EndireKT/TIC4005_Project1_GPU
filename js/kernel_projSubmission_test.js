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
  if (dispose) {
    dispose()
  };

  dispose = setup();
};

function setup() {
  let disposed = false;
  const gpu = new GPU({ mode: gpuEnabled.checked ? 'gpu' : 'cpu' });

  const kernel0 = gpu.createKernel(
    function (frame) {
      const pixel = frame[this.thread.y][this.thread.x];
      // this.color(pixel.r, pixel.g, pixel.b, pixel.a);
      // return pixel;
      return this.thread.x;
    }, {
    // LEAVE these
    output: [1024, 768],
    graphical: true,
    pipeline: true,
    tactic: 'precision'
  }
  );

  const kernel1 = gpu.createKernel(
    function (frame) {
      const pixel = frame[this.thread.y][this.thread.x];
      this.color(0, pixel.g, pixel.b, pixel.a);
    }, {
    // LEAVE these
    output: [1024, 768],
    graphical: true,
    tactic: 'precision'
  }
  );

  const kernel = gpu.createKernel(
    function (frame, filterValue, result) {
      if (filterValue == 0) {
        const pixel = frame[this.thread.y][this.thread.x];

        // const pixel = result[this.thread.y][this.thread.x];

        // this.color(pixel.r, pixel.g, pixel.b, pixel.a);

        // this.color(result[0], pixel.g, pixel.b, pixel.a);
        var sum = 0;
        return sum;
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

  // const result = 0;
  const resultAAA = kernel0(videoElement);
  const abc = 0;
  const cde = [222, 333, 444];

  function render() {
    if (disposed) {
      return;
    }
    kernel(videoElement, filterValue, result);
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



function filterMode(value) {
  // document.getElementById("show-sliders").style.display = "none";
  filterValue = value;
  console.log("filter mode: " + value);
}