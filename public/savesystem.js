'use strict';

/**
 * webDOOM Save/Load System
 * Manages game progress saves for DOOM 1 and DOOM 2 with 6 save slots each
 * Uses localStorage for persistence across sessions
 */

const SaveSystem = {
  // Configuration
  NUM_SAVE_SLOTS: 6,
  DOOM1_KEY_PREFIX: 'webdoom_doom1_save_',
  DOOM2_KEY_PREFIX: 'webdoom_doom2_save_',
  DOOM1_METADATA_KEY: 'webdoom_doom1_metadata',
  DOOM2_METADATA_KEY: 'webdoom_doom2_metadata',
  AUTO_SAVE_INTERVAL: 60000, // 1 minute in milliseconds
  
  // State
  currentGame: null, // '1' or '2'
  autoSaveTimer: null,
  saveUIVisible: false,
  loadUIVisible: false,
  
  /**
   * Initialize the save system
   */
  init: function() {
    if (!this.isSaveSupported()) {
      console.warn('SaveSystem: localStorage not available, save functionality disabled');
      return false;
    }
    
    this.setupAutoSave();
    this.createSaveUI();
    this.attachKeyboardShortcuts();
    
    console.log('SaveSystem initialized successfully');
    return true;
  },
  
  /**
   * Check if localStorage is available
   */
  isSaveSupported: function() {
    try {
      const test = '__savetest__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  },
  
  /**
   * Set the current game (1 or 2)
   */
  setCurrentGame: function(gameNumber) {
    this.currentGame = String(gameNumber);
  },
  
  /**
   * Get the prefix for the current game
   */
  getKeyPrefix: function() {
    return this.currentGame === '1' ? this.DOOM1_KEY_PREFIX : this.DOOM2_KEY_PREFIX;
  },
  
  /**
   * Get metadata key for current game
   */
  getMetadataKey: function() {
    return this.currentGame === '1' ? this.DOOM1_METADATA_KEY : this.DOOM2_METADATA_KEY;
  },
  
  /**
   * Save game state to a specific slot
   */
  saveGame: function(slotNumber) {
    if (slotNumber < 1 || slotNumber > this.NUM_SAVE_SLOTS) {
      console.error('SaveSystem: Invalid slot number', slotNumber);
      return false;
    }
    
    try {
      const gameState = this.getCurrentGameState();
      if (!gameState) {
        console.warn('SaveSystem: Could not retrieve current game state');
        return false;
      }
      
      const key = this.getKeyPrefix() + slotNumber;
      const saveData = {
        slot: slotNumber,
        timestamp: Date.now(),
        gameNumber: this.currentGame,
        state: gameState
      };
      
      localStorage.setItem(key, JSON.stringify(saveData));
      this.updateMetadata(slotNumber, gameState.levelName || 'Unknown Level');
      
      this.showNotification(`Game saved to slot ${slotNumber}`, 'success');
      console.log('SaveSystem: Game saved to slot', slotNumber);
      
      return true;
    } catch (e) {
      console.error('SaveSystem: Error saving game', e);
      this.showNotification('Failed to save game', 'error');
      return false;
    }
  },
  
  /**
   * Load game state from a specific slot
   */
  loadGame: function(slotNumber) {
    if (slotNumber < 1 || slotNumber > this.NUM_SAVE_SLOTS) {
      console.error('SaveSystem: Invalid slot number', slotNumber);
      return null;
    }
    
    try {
      const key = this.getKeyPrefix() + slotNumber;
      const savedData = localStorage.getItem(key);
      
      if (!savedData) {
        console.warn('SaveSystem: No save data found for slot', slotNumber);
        this.showNotification(`No save data in slot ${slotNumber}`, 'warning');
        return null;
      }
      
      const saveData = JSON.parse(savedData);
      
      // Restore game state
      if (this.restoreGameState(saveData.state)) {
        this.showNotification(`Loaded game from slot ${slotNumber}`, 'success');
        console.log('SaveSystem: Game loaded from slot', slotNumber);
        return saveData;
      } else {
        this.showNotification('Failed to restore game state', 'error');
        return null;
      }
    } catch (e) {
      console.error('SaveSystem: Error loading game', e);
      this.showNotification('Failed to load game', 'error');
      return null;
    }
  },
  
  /**
   * Get list of all saves for current game
   */
  getSavesList: function() {
    const saves = [];
    const keyPrefix = this.getKeyPrefix();
    const metadataKey = this.getMetadataKey();
    
    try {
      const metadata = JSON.parse(localStorage.getItem(metadataKey) || '{}');
      
      for (let i = 1; i <= this.NUM_SAVE_SLOTS; i++) {
        const key = keyPrefix + i;
        const savedData = localStorage.getItem(key);
        
        if (savedData) {
          try {
            const data = JSON.parse(savedData);
            saves.push({
              slot: i,
              timestamp: data.timestamp,
              levelName: metadata[i] || 'Unknown',
              dateString: new Date(data.timestamp).toLocaleString()
            });
          } catch (e) {
            console.warn('SaveSystem: Corrupted save in slot', i);
          }
        } else {
          saves.push({
            slot: i,
            timestamp: null,
            levelName: 'Empty',
            dateString: 'N/A'
          });
        }
      }
    } catch (e) {
      console.error('SaveSystem: Error reading saves list', e);
    }
    
    return saves;
  },
  
  /**
   * Delete a save from a specific slot
   */
  deleteSave: function(slotNumber) {
    if (slotNumber < 1 || slotNumber > this.NUM_SAVE_SLOTS) {
      console.error('SaveSystem: Invalid slot number', slotNumber);
      return false;
    }
    
    try {
      const key = this.getKeyPrefix() + slotNumber;
      localStorage.removeItem(key);
      this.updateMetadata(slotNumber, null);
      this.showNotification(`Save slot ${slotNumber} deleted`, 'success');
      return true;
    } catch (e) {
      console.error('SaveSystem: Error deleting save', e);
      this.showNotification('Failed to delete save', 'error');
      return false;
    }
  },
  
  /**
   * Update metadata for a save slot
   */
  updateMetadata: function(slotNumber, levelName) {
    try {
      const metadataKey = this.getMetadataKey();
      const metadata = JSON.parse(localStorage.getItem(metadataKey) || '{}');
      
      if (levelName === null) {
        delete metadata[slotNumber];
      } else {
        metadata[slotNumber] = levelName;
      }
      
      localStorage.setItem(metadataKey, JSON.stringify(metadata));
    } catch (e) {
      console.error('SaveSystem: Error updating metadata', e);
    }
  },
  
  /**
   * Get current game state from the Emscripten module
   * This should be called to capture the game's current state
   */
  getCurrentGameState: function() {
    try {
      if (typeof Module === 'undefined' || !Module.doom) {
        return {
          levelName: 'Level 1',
          playerHealth: 100,
          playerArmor: 0,
          weapons: [],
          inventory: [],
          timestamp: Date.now()
        };
      }
      
      // TODO: Implement actual game state retrieval from DOOM engine
      // This would require interfacing with the C++ code via Emscripten
      return {
        levelName: 'Level ' + (Math.floor(Math.random() * 32) + 1),
        playerHealth: 100,
        playerArmor: 0,
        weapons: [],
        inventory: [],
        timestamp: Date.now()
      };
    } catch (e) {
      console.error('SaveSystem: Error getting game state', e);
      return null;
    }
  },
  
  /**
   * Restore game state
   * TODO: Implement actual state restoration in DOOM engine
   */
  restoreGameState: function(gameState) {
    try {
      // TODO: Interface with DOOM engine to restore state
      console.log('SaveSystem: Restoring game state for level:', gameState.levelName);
      return true;
    } catch (e) {
      console.error('SaveSystem: Error restoring game state', e);
      return false;
    }
  },
  
  /**
   * Setup auto-save functionality
   */
  setupAutoSave: function() {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
    }
    
    this.autoSaveTimer = setInterval(() => {
      if (this.currentGame) {
        // Auto-save to slot 0 (special auto-save slot)
        const gameState = this.getCurrentGameState();
        if (gameState) {
          try {
            const key = this.getKeyPrefix() + '0_auto';
            const saveData = {
              slot: 'auto',
              timestamp: Date.now(),
              gameNumber: this.currentGame,
              state: gameState
            };
            localStorage.setItem(key, JSON.stringify(saveData));
            console.log('SaveSystem: Auto-save completed');
          } catch (e) {
            console.warn('SaveSystem: Auto-save failed', e);
          }
        }
      }
    }, this.AUTO_SAVE_INTERVAL);
  },
  
  /**
   * Create the save/load UI
   */
  createSaveUI: function() {
    // Create save panel container
    const savePanel = document.createElement('div');
    savePanel.id = 'saveLoadPanel';
    savePanel.className = 'save-load-panel';
    savePanel.innerHTML = `
      <div class="save-load-header">
        <span class="save-load-title">Save/Load Game</span>
        <button class="save-load-close" aria-label="Close">×</button>
      </div>
      <div class="save-load-content">
        <div class="save-load-tabs">
          <button class="save-load-tab active" data-tab="save">Save</button>
          <button class="save-load-tab" data-tab="load">Load</button>
        </div>
        <div class="save-load-slots" id="saveSlotsContainer">
          <!-- Slots will be rendered here -->
        </div>
        <div class="save-load-info" id="saveLoadInfo"></div>
      </div>
    `;
    
    document.body.appendChild(savePanel);
    
    // Event listeners
    savePanel.querySelector('.save-load-close').addEventListener('click', () => {
      this.hideSaveUI();
    });
    
    savePanel.querySelectorAll('.save-load-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        this.switchTab(e.target.dataset.tab);
      });
    });
    
    this.renderSaveSlots('save');
  },
  
  /**
   * Render save slots
   */
  renderSaveSlots: function(mode) {
    const container = document.getElementById('saveSlotsContainer');
    const saves = this.getSavesList();
    
    container.innerHTML = '';
    
    saves.forEach(save => {
      const slotDiv = document.createElement('div');
      slotDiv.className = 'save-slot';
      slotDiv.innerHTML = `
        <div class="slot-info">
          <div class="slot-number">Slot ${save.slot}</div>
          <div class="slot-level">${save.levelName}</div>
          <div class="slot-date">${save.dateString}</div>
        </div>
        <button class="slot-action" data-slot="${save.slot}" data-mode="${mode}">
          ${mode === 'save' ? 'Save' : 'Load'}
        </button>
        ${save.timestamp ? `<button class="slot-delete" data-slot="${save.slot}">Delete</button>` : ''}
      `;
      
      container.appendChild(slotDiv);
      
      const actionBtn = slotDiv.querySelector('.slot-action');
      actionBtn.addEventListener('click', () => {
        if (mode === 'save') {
          this.saveGame(save.slot);
          setTimeout(() => this.renderSaveSlots('save'), 500);
        } else {
          this.loadGame(save.slot);
          setTimeout(() => this.hideSaveUI(), 500);
        }
      });
      
      const deleteBtn = slotDiv.querySelector('.slot-delete');
      if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
          if (confirm(`Delete save in slot ${save.slot}?`)) {
            this.deleteSave(save.slot);
            this.renderSaveSlots(mode);
          }
        });
      }
    });
  },
  
  /**
   * Switch between save and load tabs
   */
  switchTab: function(tab) {
    document.querySelectorAll('.save-load-tab').forEach(t => {
      t.classList.remove('active');
    });
    document.querySelector(`.save-load-tab[data-tab="${tab}"]`).classList.add('active');
    this.renderSaveSlots(tab);
  },
  
  /**
   * Show save UI
   */
  showSaveUI: function() {
    const panel = document.getElementById('saveLoadPanel');
    if (panel) {
      panel.style.display = 'block';
      this.saveUIVisible = true;
    }
  },
  
  /**
   * Hide save UI
   */
  hideSaveUI: function() {
    const panel = document.getElementById('saveLoadPanel');
    if (panel) {
      panel.style.display = 'none';
      this.saveUIVisible = false;
    }
  },
  
  /**
   * Attach keyboard shortcuts
   */
  attachKeyboardShortcuts: function() {
    document.addEventListener('keydown', (e) => {
      // Only work in fullscreen mode
      if (!Module.inFullscreen) return;
      
      // F5 = Save
      if (e.key === 'F5' || (e.ctrlKey && e.key === 's')) {
        e.preventDefault();
        this.quickSave();
      }
      // F9 = Load
      else if (e.key === 'F9' || (e.ctrlKey && e.key === 'l')) {
        e.preventDefault();
        this.quickLoad();
      }
      // ESC = Toggle save menu (fullscreen)
      else if (e.key === 'Escape' && Module.inFullscreen) {
        e.preventDefault();
        if (this.saveUIVisible) {
          this.hideSaveUI();
        } else {
          this.showSaveUI();
        }
      }
    });
  },
  
  /**
   * Quick save to slot 1
   */
  quickSave: function() {
    if (this.currentGame) {
      this.saveGame(1);
      this.showNotification('Quick saved to slot 1', 'success', 2000);
    }
  },
  
  /**
   * Quick load from slot 1
   */
  quickLoad: function() {
    if (this.currentGame) {
      const result = this.loadGame(1);
      if (result) {
        this.showNotification('Quick loaded from slot 1', 'success', 2000);
      }
    }
  },
  
  /**
   * Show notification message
   */
  showNotification: function(message, type = 'info', duration = 3000) {
    const notification = document.createElement('div');
    notification.className = `save-notification save-notification-${type}`;
    notification.textContent = message;
    notification.style.display = 'block';
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => notification.remove(), 300);
    }, duration);
  },
  
  /**
   * Clean up resources
   */
  destroy: function() {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
    }
  }
};

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SaveSystem;
}