'use strict';

/**
 * UZDoom WebAssembly Integration
 * Handles WebAssembly compilation and execution of UZDoom engine
 */

window.UZDoomIntegration = (function() {
  let wasmModule = null;
  let isInitialized = false;
  let gameRunning = false;

  /**
   * Initialize UZDoom WebAssembly module
   */
  async function init() {
    try {
      // Initialize UZDoom Loader first
      if (window.UZDoomLoader) {
        window.UZDoomLoader.init();
      }

      console.log('UZDoom Integration initialized');
      isInitialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize UZDoom:', error);
      return false;
    }
  }

  /**
   * Start game with loaded configuration
   */
  async function startGame() {
    if (!isInitialized) {
      console.error('UZDoom not initialized');
      return false;
    }

    try {
      const config = window.UZDoomLoader.getConfig();
      console.log('Starting UZDoom with config:', config);

      // Build command-line arguments for UZDoom
      const args = buildCommandLine(config);
      console.log('Command line args:', args);

      // Here you would typically pass the args to the compiled UZDoom wasm
      // module.callMain(args);

      gameRunning = true;
      return true;
    } catch (error) {
      console.error('Failed to start game:', error);
      return false;
    }
  }

  /**
   * Build command line arguments from configuration
   */
  function buildCommandLine(config) {
    const args = ['uzdoom'];

    // Add IWAD
    args.push('-iwad');
    args.push(getIwadPath(config.iwad));

    // Add PWADs
    if (config.pwads && config.pwads.length > 0) {
      args.push('-file');
      config.pwads.forEach(pwad => {
        args.push(pwad.name);
      });
    }

    // Add Mods
    if (config.mods && config.mods.length > 0) {
      args.push('-file');
      config.mods.forEach(mod => {
        args.push(mod.name);
      });
    }

    // Add graphics settings
    if (config.settings) {
      const settings = config.settings;

      args.push('-width');
      args.push(settings.screenwidth.toString());

      args.push('-height');
      args.push(settings.screenheight.toString());

      if (settings.fullscreen) {
        args.push('-fullscreen');
      }

      // Difficulty
      args.push('-skill');
      args.push((settings.difficulty).toString());
    }

    return args;
  }

  /**
   * Get path to IWAD file
   */
  function getIwadPath(iwad) {
    const iwadPaths = {
      'doom': '/data/doom.wad',
      'doom2': '/data/doom2.wad',
      'tnt': '/data/tnt.wad',
      'plutonia': '/data/plutonia.wad',
      'chex': '/data/chex.wad'
    };
    return iwadPaths[iwad] || iwadPaths['doom2'];
  }

  /**
   * Load WAD file into the engine
   */
  async function loadWadFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const wadData = new Uint8Array(e.target.result);
        console.log(`Loaded WAD file: ${file.name} (${wadData.length} bytes)`);
        resolve(wadData);
      };

      reader.onerror = () => {
        reject(new Error(`Failed to read WAD file: ${file.name}`));
      };

      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Load PK3/MOD file into the engine
   */
  async function loadModFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const modData = new Uint8Array(e.target.result);
        console.log(`Loaded MOD file: ${file.name} (${modData.length} bytes)`);
        resolve(modData);
      };

      reader.onerror = () => {
        reject(new Error(`Failed to read MOD file: ${file.name}`));
      };

      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Apply graphics settings to the engine
   */
  function applyGraphicsSettings(settings) {
    try {
      // Canvas resize
      const canvas = document.getElementById('doom');
      if (canvas) {
        canvas.width = settings.screenwidth;
        canvas.height = settings.screenheight;
      }

      // Store settings for WebGL context
      if (window.Module) {
        window.Module.settings = settings;
      }

      console.log('Graphics settings applied:', settings);
      return true;
    } catch (error) {
      console.error('Failed to apply graphics settings:', error);
      return false;
    }
  }

  /**
   * Apply audio settings to the engine
   */
  function applyAudioSettings(settings) {
    try {
      // Audio context settings would go here
      // This would interact with the compiled wasm audio system
      console.log('Audio settings applied:', settings);
      return true;
    } catch (error) {
      console.error('Failed to apply audio settings:', error);
      return false;
    }
  }

  /**
   * Apply control settings to the engine
   */
  function applyControlSettings(settings) {
    try {
      // Input handling settings
      console.log('Control settings applied:', settings);
      return true;
    } catch (error) {
      console.error('Failed to apply control settings:', error);
      return false;
    }
  }

  /**
   * Get game status
   */
  function getGameStatus() {
    return {
      initialized: isInitialized,
      running: gameRunning,
      module: wasmModule
    };
  }

  /**
   * Pause the game
   */
  function pauseGame() {
    if (gameRunning) {
      gameRunning = false;
      console.log('Game paused');
      return true;
    }
    return false;
  }

  /**
   * Resume the game
   */
  function resumeGame() {
    if (isInitialized && !gameRunning) {
      gameRunning = true;
      console.log('Game resumed');
      return true;
    }
    return false;
  }

  /**
   * Stop the game
   */
  function stopGame() {
    if (gameRunning) {
      gameRunning = false;
      console.log('Game stopped');
      return true;
    }
    return false;
  }

  // Public API
  return {
    init: init,
    startGame: startGame,
    loadWadFile: loadWadFile,
    loadModFile: loadModFile,
    applyGraphicsSettings: applyGraphicsSettings,
    applyAudioSettings: applyAudioSettings,
    applyControlSettings: applyControlSettings,
    getGameStatus: getGameStatus,
    pauseGame: pauseGame,
    resumeGame: resumeGame,
    stopGame: stopGame
  };
})();
