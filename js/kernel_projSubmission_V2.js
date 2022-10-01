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

  const kernel = gpu.createKernel(
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

  canvasParent.appendChild(kernel.canvas);
  const videoElement = document.querySelector('video');

  function render() {
    if (disposed) {
      return;
    }
    kernel(videoElement);
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