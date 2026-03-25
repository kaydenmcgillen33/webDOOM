'use strict';

(function () {
  var preview = null;
  var doomCanvas = null;
  var fullscreenButton = null;
  var saveSaveButton = null;
  var saveLoadButton = null;

  window.Module = {
    monitorRunDependencies: function (toLoad) {
      this.dependencies = Math.max(this.dependencies, toLoad);
    },

    inFullscreen: false,
    dependencies: 0,
    
    setStatus: null,
    progress: null,

    loader: null,
    canvas: null
  };

  function getCanvas () {
    doomCanvas.addEventListener('webglcontextlost', function (event) {
      alert('WebGL context lost. You need to reload the page.');
      event.preventDefault();
    }, false);

    doomCanvas.addEventListener('contextmenu', function (event) {
      event.preventDefault();
    });

    fullscreenButton.addEventListener('click', function () {
      Module.requestFullscreen(true, false);
    });

    return doomCanvas;
  }

  function getStatus (status) {
    var loading = status.match(/([^(]+)\((\d+(\.\d+)?)\/(\d+)\)/);

    if (loading) {
      var progress = loading[2] / loading[4] * 100;
      Module.progress.innerHTML = progress.toFixed(1) + '%';

      if (progress === 100) {
        setTimeout(function () {
          fullscreenButton.classList.add('visible');
          Module.loader.classList.add('completed');
          doomCanvas.classList.add('ready');
        }, 500);

        setTimeout(function () {
          Module.canvas.dispatchEvent(new Event('mousedown'));
        }, 2000);
      }
    }
  }

  function onPointerLockChange () {
    Module.inFullscreen = !Module.inFullscreen;

    if (!Module.inFullscreen) {
      doomCanvas.classList.remove('centered');
      // Show save/load buttons when exiting fullscreen
      if (saveSaveButton) saveSaveButton.style.display = 'block';
      if (saveLoadButton) saveLoadButton.style.display = 'block';
    } else {
      doomCanvas.classList.add('centered');
      // Hide save/load buttons when entering fullscreen
      if (saveSaveButton) saveSaveButton.style.display = 'none';
      if (saveLoadButton) saveLoadButton.style.display = 'none';
    }
  }

  function onGameClick (game) {
    var doomScript = document.createElement('script');
    document.body.appendChild(doomScript);
    doomScript.type = 'text/javascript';

    preview.classList.add('hidden');
    doomScript.src = game + '.js';
    
    // Initialize save system when game loads
    setTimeout(function() {
      if (typeof SaveSystem !== 'undefined') {
        SaveSystem.setCurrentGame(game === 'doom1' ? '1' : '2');
        SaveSystem.init();
      }
    }, 1000);
  }

  window.addEventListener('DOMContentLoaded', function () {
    var games = document.getElementsByClassName('doom');
    preview = document.getElementById('preview');

    document.exitPointerLock = document.exitPointerLock || document.mozExitPointerLock || document.webkitExitPointerLock;
    document.exitFullscreen = document.exitFullscreen || document.mozCancelFullScreen || document.webkitCancelFullScreen;

    document.addEventListener('mozpointerlockchange', onPointerLockChange, false);
    document.addEventListener('pointerlockchange', onPointerLockChange, false);

    games[0].addEventListener('click', onGameClick.bind(null, 'doom1'));
    games[1].addEventListener('click', onGameClick.bind(null, 'doom2'));
    
    fullscreenButton = document.getElementById('fullscreen');
    Module.progress = document.getElementById('progress');
    Module.loader = document.getElementById('loader');
    doomCanvas = document.getElementById('doom');

    Module.setStatus = getStatus;
    Module.canvas = getCanvas();
    
    // Create save/load buttons for non-fullscreen mode
    createSaveLoadButtons();
  });
  
  function createSaveLoadButtons() {
    saveSaveButton = document.createElement('button');
    saveSaveButton.id = 'saveSaveButton';
    saveSaveButton.textContent = 'SAVE GAME';
    saveSaveButton.style.display = 'none';
    saveSaveButton.addEventListener('click', function() {
      if (typeof SaveSystem !== 'undefined') {
        SaveSystem.showSaveUI();
        SaveSystem.switchTab('save');
      }
    });
    document.body.appendChild(saveSaveButton);
    
    saveLoadButton = document.createElement('button');
    saveLoadButton.id = 'saveLoadButton';
    saveLoadButton.textContent = 'LOAD GAME';
    saveLoadButton.style.display = 'none';
    saveLoadButton.addEventListener('click', function() {
      if (typeof SaveSystem !== 'undefined') {
        SaveSystem.showSaveUI();
        SaveSystem.switchTab('load');
      }
    });
    document.body.appendChild(saveLoadButton);
  }
})();