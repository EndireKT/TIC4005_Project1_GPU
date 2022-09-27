
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
    .addFunction(invertedColor1);

  // THIS IS THE IMPORTANT STUFF
  const kernel = gpu.createKernel(
    function (frame, weirdFilter) {
      const pixel = frame[this.thread.y][this.thread.x];
      if (weirdFilter) {



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
  function render() {
    if (disposed) {
      return;
    }
    kernel(videoElement, weirdFilter.checked);
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
