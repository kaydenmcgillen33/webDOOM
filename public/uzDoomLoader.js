'use strict';

/**
 * UZDoom Loader - Manages UZDoom WebAssembly Engine
 * Handles WAD file loading, mod support, and game configuration
 */

window.UZDoomLoader = (function() {
  const STORAGE_PREFIX = 'uzDoom_';
  const MAX_WAD_SIZE = 100 * 1024 * 1024; // 100MB
  const SUPPORTED_FORMATS = ['.wad', '.pk3', '.pke', '.zip'];

  let currentConfig = {
    iwad: 'doom2',
    pwads: [],
    mods: [],
    settings: {
      difficulty: 3,
      brightness: 0.8,
      gamma: 1.0,
      mastervolume: 0.8,
      musicvolume: 0.6,
      sfxvolume: 0.8,
      screenwidth: 1280,
      screenheight: 720,
      fullscreen: true,
      vsync: true,
      renderertype: 'OpenGL',
      aspectratio: '16:9',
      mousesensitivity: 1.0,
      invertmouse: false
    }
  };

  /**
   * Initialize UZDoom Loader
   */
  function init() {
    loadConfigFromStorage();
    createSettingsMenu();
    setupFileInputs();
    setupEventListeners();
  }

  /**
   * Load configuration from browser storage
   */
  function loadConfigFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_PREFIX + 'config');
      if (stored) {
        const saved = JSON.parse(stored);
        currentConfig = { ...currentConfig, ...saved };
      }
    } catch (e) {
      console.warn('Failed to load UZDoom config from storage:', e);
    }
  }

  /**
   * Save configuration to browser storage
   */
  function saveConfigToStorage() {
    try {
      localStorage.setItem(STORAGE_PREFIX + 'config', JSON.stringify(currentConfig));
    } catch (e) {
      console.warn('Failed to save UZDoom config:', e);
    }
  }

  /**
   * Create the UZDoom Settings Menu
   */
  function createSettingsMenu() {
    const menuContainer = document.createElement('div');
    menuContainer.id = 'uzDoomSettingsMenu';
    menuContainer.className = 'uzDoom-settings-menu';
    menuContainer.innerHTML = `
      <div class="settings-panel">
        <div class="settings-header">
          <h2>UZDOOM SETTINGS</h2>
          <button class="close-btn" id="closeSettings">×</button>
        </div>
        
        <div class="settings-tabs">
          <button class="tab-btn active" data-tab="gameplay">GAMEPLAY</button>
          <button class="tab-btn" data-tab="graphics">GRAPHICS</button>
          <button class="tab-btn" data-tab="audio">AUDIO</button>
          <button class="tab-btn" data-tab="controls">CONTROLS</button>
          <button class="tab-btn" data-tab="files">FILES</button>
        </div>
        
        <!-- GAMEPLAY TAB -->
        <div class="tab-content active" id="tab-gameplay">
          <div class="setting-item">
            <label>Difficulty Level</label>
            <select id="difficulty">
              <option value="0">IDDQD (God Mode)</option>
              <option value="1">BABY</option>
              <option value="2">EASY</option>
              <option value="3" selected>NORMAL</option>
              <option value="4">HARD</option>
              <option value="5">NIGHTMARE</option>
            </select>
          </div>
        </div>
        
        <!-- GRAPHICS TAB -->
        <div class="tab-content" id="tab-graphics">
          <div class="setting-item">
            <label>Resolution Width: <span id="widthValue">1280</span>px</label>
            <input type="range" id="screenwidth" min="640" max="4096" step="16" value="1280">
          </div>
          <div class="setting-item">
            <label>Resolution Height: <span id="heightValue">720</span>px</label>
            <input type="range" id="screenheight" min="480" max="2160" step="16" value="720">
          </div>
          <div class="setting-item">
            <label>Brightness: <span id="brightnessValue">80%</span></label>
            <input type="range" id="brightness" min="0" max="1" step="0.1" value="0.8">
          </div>
          <div class="setting-item">
            <label>Gamma Correction: <span id="gammaValue">1.0</span></label>
            <input type="range" id="gamma" min="0.5" max="2.0" step="0.1" value="1.0">
          </div>
          <div class="setting-item">
            <label>
              <input type="checkbox" id="vsync">
              V-Sync
            </label>
          </div>
          <div class="setting-item">
            <label>Aspect Ratio</label>
            <select id="aspectratio">
              <option value="4:3">4:3 (Standard)</option>
              <option value="16:10">16:10 (Widescreen)</option>
              <option value="16:9" selected>16:9 (Cinema)</option>
              <option value="21:9">21:9 (Ultrawide)</option>
            </select>
          </div>
        </div>
        
        <!-- AUDIO TAB -->
        <div class="tab-content" id="tab-audio">
          <div class="setting-item">
            <label>Master Volume: <span id="mastervolumeValue">80%</span></label>
            <input type="range" id="mastervolume" min="0" max="1" step="0.05" value="0.8">
          </div>
          <div class="setting-item">
            <label>Music Volume: <span id="musicvolumeValue">60%</span></label>
            <input type="range" id="musicvolume" min="0" max="1" step="0.05" value="0.6">
          </div>
          <div class="setting-item">
            <label>SFX Volume: <span id="sfxvolumeValue">80%</span></label>
            <input type="range" id="sfxvolume" min="0" max="1" step="0.05" value="0.8">
          </div>
        </div>
        
        <!-- CONTROLS TAB -->
        <div class="tab-content" id="tab-controls">
          <div class="setting-item">
            <label>Mouse Sensitivity: <span id="sensValue">1.0</span></label>
            <input type="range" id="mousesensitivity" min="0.1" max="5.0" step="0.1" value="1.0">
          </div>
          <div class="setting-item">
            <label>
              <input type="checkbox" id="invertmouse">
              Invert Mouse Y-Axis
            </label>
          </div>
        </div>
        
        <!-- FILES TAB -->
        <div class="tab-content" id="tab-files">
          <div class="file-section">
            <h3>IWAD (Main Game)</h3>
            <select id="iwadSelect">
              <option value="doom">Doom 1</option>
              <option value="doom2" selected>Doom 2</option>
              <option value="tnt">TNT: Evilution</option>
              <option value="plutonia">Plutonia Experiment</option>
              <option value="chex">Chex Quest</option>
            </select>
          </div>
          
          <div class="file-section">
            <h3>PWADs (Custom Maps)</h3>
            <div id="pwadList" class="file-list"></div>
            <input type="file" id="pwadInput" multiple accept=".wad,.pk3,.pke,.zip" style="display:none;">
            <button id="addPwadBtn" class="action-btn">+ ADD PWAD</button>
          </div>
          
          <div class="file-section">
            <h3>MODS & TEXTURES</h3>
            <div id="modList" class="file-list"></div>
            <input type="file" id="modInput" multiple accept=".pk3,.pke,.zip" style="display:none;">
            <button id="addModBtn" class="action-btn">+ ADD MOD</button>
          </div>
        </div>
        
        <div class="settings-footer">
          <button id="applySettings" class="action-btn primary">APPLY</button>
          <button id="resetSettings" class="action-btn">RESET</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(menuContainer);
    attachMenuEventListeners();
  }

  /**
   * Attach event listeners to menu elements
   */
  function attachMenuEventListeners() {
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tabName = e.target.dataset.tab;
        switchTab(tabName);
      });
    });

    // Close menu
    document.getElementById('closeSettings').addEventListener('click', hideSettingsMenu);

    // Range inputs with value display
    document.getElementById('screenwidth').addEventListener('change', (e) => {
      document.getElementById('widthValue').textContent = e.target.value;
      currentConfig.settings.screenwidth = parseInt(e.target.value);
    });

    document.getElementById('screenheight').addEventListener('change', (e) => {
      document.getElementById('heightValue').textContent = e.target.value;
      currentConfig.settings.screenheight = parseInt(e.target.value);
    });

    document.getElementById('brightness').addEventListener('change', (e) => {
      const val = (parseFloat(e.target.value) * 100).toFixed(0);
      document.getElementById('brightnessValue').textContent = val + '%';
      currentConfig.settings.brightness = parseFloat(e.target.value);
    });

    document.getElementById('gamma').addEventListener('change', (e) => {
      document.getElementById('gammaValue').textContent = parseFloat(e.target.value).toFixed(1);
      currentConfig.settings.gamma = parseFloat(e.target.value);
    });

    document.getElementById('mastervolume').addEventListener('change', (e) => {
      const val = (parseFloat(e.target.value) * 100).toFixed(0);
      document.getElementById('mastervolumeValue').textContent = val + '%';
      currentConfig.settings.mastervolume = parseFloat(e.target.value);
    });

    document.getElementById('musicvolume').addEventListener('change', (e) => {
      const val = (parseFloat(e.target.value) * 100).toFixed(0);
      document.getElementById('musicvolumeValue').textContent = val + '%';
      currentConfig.settings.musicvolume = parseFloat(e.target.value);
    });

    document.getElementById('sfxvolume').addEventListener('change', (e) => {
      const val = (parseFloat(e.target.value) * 100).toFixed(0);
      document.getElementById('sfxvolumeValue').textContent = val + '%';
      currentConfig.settings.sfxvolume = parseFloat(e.target.value);
    });

    document.getElementById('mousesensitivity').addEventListener('change', (e) => {
      document.getElementById('sensValue').textContent = parseFloat(e.target.value).toFixed(1);
      currentConfig.settings.mousesensitivity = parseFloat(e.target.value);
    });

    // Checkboxes
    document.getElementById('vsync').addEventListener('change', (e) => {
      currentConfig.settings.vsync = e.target.checked;
    });

    document.getElementById('invertmouse').addEventListener('change', (e) => {
      currentConfig.settings.invertmouse = e.target.checked;
    });

    // Selects
    document.getElementById('difficulty').addEventListener('change', (e) => {
      currentConfig.settings.difficulty = parseInt(e.target.value);
    });

    document.getElementById('aspectratio').addEventListener('change', (e) => {
      currentConfig.settings.aspectratio = e.target.value;
    });

    document.getElementById('iwadSelect').addEventListener('change', (e) => {
      currentConfig.iwad = e.target.value;
    });

    // File inputs
    document.getElementById('addPwadBtn').addEventListener('click', () => {
      document.getElementById('pwadInput').click();
    });

    document.getElementById('addModBtn').addEventListener('click', () => {
      document.getElementById('modInput').click();
    });

    document.getElementById('pwadInput').addEventListener('change', handlePwadFiles);
    document.getElementById('modInput').addEventListener('change', handleModFiles);

    // Action buttons
    document.getElementById('applySettings').addEventListener('click', applySettings);
    document.getElementById('resetSettings').addEventListener('click', resetSettings);
  }

  /**
   * Switch between settings tabs
   */
  function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => {
      tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.remove('active');
    });

    document.getElementById('tab-' + tabName).classList.add('active');
    document.querySelector('[data-tab="' + tabName + '"]').classList.add('active');
  }

  /**
   * Handle PWAD file uploads
   */
  function handlePwadFiles(e) {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      if (file.size > MAX_WAD_SIZE) {
        alert(`File ${file.name} exceeds 100MB limit`);
        return;
      }
      addPwadToList(file);
    });
  }

  /**
   * Handle MOD file uploads
   */
  function handleModFiles(e) {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      if (file.size > MAX_WAD_SIZE) {
        alert(`File ${file.name} exceeds 100MB limit`);
        return;
      }
      addModToList(file);
    });
  }

  /**
   * Add PWAD to list
   */
  function addPwadToList(file) {
    const item = {
      name: file.name,
      size: file.size,
      file: file,
      id: Date.now() + Math.random()
    };

    currentConfig.pwads.push(item);
    updatePwadListUI();
  }

  /**
   * Add MOD to list
   */
  function addModToList(file) {
    const item = {
      name: file.name,
      size: file.size,
      file: file,
      id: Date.now() + Math.random()
    };

    currentConfig.mods.push(item);
    updateModListUI();
  }

  /**
   * Update PWAD list UI
   */
  function updatePwadListUI() {
    const list = document.getElementById('pwadList');
    list.innerHTML = '';

    currentConfig.pwads.forEach(item => {
      const div = document.createElement('div');
      div.className = 'file-item';
      div.innerHTML = `
        <span>${item.name}</span>
        <small>${(item.size / 1024 / 1024).toFixed(2)}MB</small>
        <button class="remove-btn" onclick="UZDoomLoader.removePwad('${item.id}')">×</button>
      `;
      list.appendChild(div);
    });
  }

  /**
   * Update MOD list UI
   */
  function updateModListUI() {
    const list = document.getElementById('modList');
    list.innerHTML = '';

    currentConfig.mods.forEach(item => {
      const div = document.createElement('div');
      div.className = 'file-item';
      div.innerHTML = `
        <span>${item.name}</span>
        <small>${(item.size / 1024 / 1024).toFixed(2)}MB</small>
        <button class="remove-btn" onclick="UZDoomLoader.removeMod('${item.id}')">×</button>
      `;
      list.appendChild(div);
    });
  }

  /**
   * Remove PWAD from list
   */
  function removePwad(id) {
    currentConfig.pwads = currentConfig.pwads.filter(item => item.id !== id);
    updatePwadListUI();
  }

  /**
   * Remove MOD from list
   */
  function removeMod(id) {
    currentConfig.mods = currentConfig.mods.filter(item => item.id !== id);
    updateModListUI();
  }

  /**
   * Setup file input elements
   */
  function setupFileInputs() {
    // File inputs are created in the menu
  }

  /**
   * Setup event listeners
   */
  function setupEventListeners() {
    // Additional event setup if needed
  }

  /**
   * Apply settings and save
   */
  function applySettings() {
    saveConfigToStorage();
    alert('Settings applied and saved!');
  }

  /**
   * Reset settings to defaults
   */
  function resetSettings() {
    if (confirm('Reset all settings to defaults?')) {
      currentConfig = {
        iwad: 'doom2',
        pwads: [],
        mods: [],
        settings: {
          difficulty: 3,
          brightness: 0.8,
          gamma: 1.0,
          mastervolume: 0.8,
          musicvolume: 0.6,
          sfxvolume: 0.8,
          screenwidth: 1280,
          screenheight: 720,
          fullscreen: true,
          vsync: true,
          renderertype: 'OpenGL',
          aspectratio: '16:9',
          mousesensitivity: 1.0,
          invertmouse: false
        }
      };
      saveConfigToStorage();
      location.reload();
    }
  }

  /**
   * Show settings menu
   */
  function showSettingsMenu() {
    const menu = document.getElementById('uzDoomSettingsMenu');
    if (menu) menu.classList.add('visible');
  }

  /**
   * Hide settings menu
   */
  function hideSettingsMenu() {
    const menu = document.getElementById('uzDoomSettingsMenu');
    if (menu) menu.classList.remove('visible');
  }

  /**
   * Load game with current config
   */
  function loadGame() {
    const config = {
      iwad: currentConfig.iwad,
      pwads: currentConfig.pwads,
      mods: currentConfig.mods,
      settings: currentConfig.settings
    };
    return config;
  }

  /**
   * Get current configuration
   */
  function getConfig() {
    return JSON.parse(JSON.stringify(currentConfig));
  }

  // Public API
  return {
    init: init,
    showSettingsMenu: showSettingsMenu,
    hideSettingsMenu: hideSettingsMenu,
    loadGame: loadGame,
    getConfig: getConfig,
    removePwad: removePwad,
    removeMod: removeMod
  };
})();
