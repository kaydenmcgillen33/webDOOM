# UZDoom WebAssembly Integration Guide

## Overview

This document describes the integration of the UZDoom engine into the webDOOM project using WebAssembly. The integration provides:

- **Advanced DOOM Engine**: UZDoom's feature-rich implementation with enhanced rendering
- **WAD File Loading**: Support for custom WAD files (DOOM 1/2 maps and content)
- **Mod Support**: Full PK3/PKE mod compatibility
- **Settings Menu**: Comprehensive in-game configuration system
- **WebAssembly Compilation**: Modern web-based deployment

## Components

### 1. uzDoomLoader.js
Manages the UZDoom configuration and settings menu:
- Game configuration storage (IWAD, PWADs, Mods)
- Settings persistence using localStorage
- File upload and management
- Interactive settings menu with tabs for:
  - Gameplay (difficulty, etc.)
  - Graphics (resolution, brightness, gamma)
  - Audio (master volume, music, SFX)
  - Controls (mouse sensitivity, inversion)
  - Files (WAD and Mod loading)

### 2. uzDoomIntegration.js
Handles WebAssembly engine integration:
- WebAssembly module initialization
- Game lifecycle management (start, pause, resume, stop)
- WAD and MOD file loading
- Settings application (graphics, audio, controls)
- Command-line argument building for the UZDoom engine

### 3. uzDoomSettings.css
Provides authentic retro styling:
- Classic green-on-black terminal aesthetic
- Responsive layout with tab-based navigation
- Glowing effects and visual feedback
- Proper DOOM-style UI elements

### 4. uzdoom-wasm-loader.html
Entry point for the UZDoom WebAssembly build:
- Canvas setup for rendering
- Control buttons (Settings, Pause)
- Launch interface
- Script integration

## Building UZDoom for WebAssembly

### Prerequisites
```bash
# Install Emscripten
git clone https://github.com/emscripten-core/emsdk.git
cd emsdk
./emsdk install latest
./emsdk activate latest
source ./emsdk_env.sh
```

### Compilation Steps

1. **Clone UZDoom Repository**
   ```bash
   git clone https://github.com/UZDoom/UZDoom.git
   cd UZDoom
   ```

2. **Create WebAssembly Build Configuration**
   Create `CMakeLists.wasm.txt`:
   ```cmake
   # Use Emscripten toolchain
   set(CMAKE_TOOLCHAIN_FILE $ENV{EMSDK}/upstream/emscripten/cmake/Modules/Platform/Emscripten.cmake)
   set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -s WASM=1 -s USE_SDL=2 -s USE_ZLIB=1 -s ALLOW_MEMORY_GROWTH=1")
   ```

3. **Configure Build**
   ```bash
   mkdir build-wasm
   cd build-wasm
   emcmake cmake -DCMAKE_BUILD_TYPE=Release -DCMAKE_TOOLCHAIN_FILE=$EMSDK/upstream/emscripten/cmake/Modules/Platform/Emscripten.cmake ..
   ```

4. **Compile**
   ```bash
   emmake make -j$(nproc)
   ```

5. **Output Files**
   - `src/uzdoom.js` - JavaScript runtime wrapper
   - `src/uzdoom.wasm` - WebAssembly binary
   - `src/uzdoom.data` - Game data (if pre-loaded)

### Emscripten Compiler Flags

Key flags for WebAssembly compilation:

```bash
emcxx [sources] \
  -s WASM=1                          # Generate WebAssembly
  -s USE_SDL=2                       # SDL2 support
  -s USE_ZLIB=1                      # Compression
  -s USE_LIBOGG=1                    # Audio format support
  -s USE_LIBVORBIS=1                 # Audio codec
  -s ALLOW_MEMORY_GROWTH=1           # Dynamic memory
  -s INITIAL_MEMORY=536870912        # 512MB initial memory
  -s MAXIMUM_MEMORY=2147483648       # 2GB max memory
  -s ASSERTIONS=0                    # Disable for release
  -O3                                # Optimization level 3
  -o uzdoom.js
```

## Configuration Format

The loader uses the following configuration structure:

```javascript
{
  iwad: 'doom2',                    // Base game (doom, doom2, tnt, plutonia, chex)
  pwads: [                          // Custom map files
    { name: 'map.wad', size: 1024, file: File, id: 123456 }
  ],
  mods: [                           // Mod/texture packs
    { name: 'mod.pk3', size: 2048, file: File, id: 123457 }
  ],
  settings: {
    difficulty: 3,                  // 0-5 (IDDQD to Nightmare)
    brightness: 0.8,                // 0-1
    gamma: 1.0,                     // 0.5-2.0
    mastervolume: 0.8,              // 0-1
    musicvolume: 0.6,               // 0-1
    sfxvolume: 0.8,                 // 0-1
    screenwidth: 1280,              // pixels
    screenheight: 720,              // pixels
    fullscreen: true,               // boolean
    vsync: true,                    // boolean
    renderertype: 'OpenGL',         // 'OpenGL' or 'Software'
    aspectratio: '16:9',            // '4:3', '16:10', '16:9', '21:9'
    mousesensitivity: 1.0,          // 0.1-5.0
    invertmouse: false              // boolean
  }
}
```

## API Reference

### UZDoomLoader

```javascript
// Initialize loader
UZDoomLoader.init()

// Show/hide settings menu
UZDoomLoader.showSettingsMenu()
UZDoomLoader.hideSettingsMenu()

// Load game with current config
const config = UZDoomLoader.loadGame()

// Get current configuration
const config = UZDoomLoader.getConfig()

// Remove items from lists
UZDoomLoader.removePwad(id)
UZDoomLoader.removeMod(id)
```

### UZDoomIntegration

```javascript
// Initialize WebAssembly
await UZDoomIntegration.init()

// Game lifecycle
await UZDoomIntegration.startGame()
UZDoomIntegration.pauseGame()
UZDoomIntegration.resumeGame()
UZDoomIntegration.stopGame()

// File loading
await UZDoomIntegration.loadWadFile(file)
await UZDoomIntegration.loadModFile(file)

// Settings application
UZDoomIntegration.applyGraphicsSettings(settings)
UZDoomIntegration.applyAudioSettings(settings)
UZDoomIntegration.applyControlSettings(settings)

// Status
const status = UZDoomIntegration.getGameStatus()
// { initialized: bool, running: bool, module: WasmModule }
```

## File Format Support

### IWADs (Base Games)
- `DOOM.WAD` - Doom
- `DOOM2.WAD` - Doom 2
- `TNT.WAD` - TNT: Evilution
- `PLUTONIA.WAD` - The Plutonia Experiment
- `CHEX.WAD` - Chex Quest

### PWADs (Custom Maps)
- `.wad` - Standard WAD format
- `.pk3` - Zip-based format with folder structure
- `.pke` - Encrypted PK3 format
- `.zip` - Generic zip archive

### Data Requirements
Minimum required files in `/data/`:
- `doom.wad` - Doom IWAD
- `doom2.wad` - Doom 2 IWAD
- `tnt.wad` - TNT IWAD
- `plutonia.wad` - Plutonia IWAD
- `chex.wad` - Chex Quest IWAD

## Performance Optimization

### Memory Management
```javascript
// UZDoom WASM module uses dynamic memory growth
// Initial: 512MB, Maximum: 2GB
// Adjust in Emscripten compiler flags if needed
```

### WebGL Context
```javascript
// Configure WebGL for optimal performance
const canvas = document.getElementById('doom');
const ctx = canvas.getContext('webgl2', {
  antialias: false,
  preserveDrawingBuffer: true,
  powerPreference: 'high-performance'
});
```

### Async File Loading
```javascript
// Large files (50MB+) should be loaded asynchronously
await UZDoomIntegration.loadWadFile(largeFile);
```

## Debugging

### Browser Console
```javascript
// Check initialization
console.log(UZDoomIntegration.getGameStatus())

// View current configuration
console.log(UZDoomLoader.getConfig())

// Check for errors in game loop
```

### Chrome DevTools
- Performance profiling in Timeline tab
- WebAssembly module inspection
- Memory profiling for large WAD files

### Emscripten Runtime
```bash
# Enable debug mode during compilation
emcxx -g4 [sources]
```

## Troubleshooting

### WAD Not Loading
1. Verify file size is under 100MB
2. Check file format is supported (.wad, .pk3, .pke, .zip)
3. Ensure IWAD is selected before launching
4. Check browser console for error messages

### Settings Not Applied
1. Verify settings menu was closed
2. Check that "APPLY" button was clicked
3. Clear browser storage if needed: `localStorage.clear()`
4. Check browser's local storage limit (typically 5-10MB)

### Game Crashes on Launch
1. Check browser console for error logs
2. Verify WebAssembly support in browser
3. Try with default settings (click "RESET")
4. Check that IWAD file exists and is valid

### Performance Issues
1. Reduce screen resolution
2. Disable V-Sync
3. Lower brightness/gamma settings
4. Close other browser tabs
5. Check system WebGL capabilities

## Browser Compatibility

### Supported Browsers
- Chrome/Chromium 74+
- Firefox 79+
- Safari 14.1+
- Edge 79+

### Required Features
- WebAssembly (WASM)
- WebGL 2.0 (or WebGL 1.0 with extensions)
- Web Storage API (localStorage)
- File API
- Pointer Lock API
- Fullscreen API

## Future Enhancements

- [ ] Cloud save synchronization
- [ ] Multiplayer support via WebRTC
- [ ] ACS scripting console
- [ ] MAPINFO parsing
- [ ] DECORATE sprite editor
- [ ] Shader customization UI
- [ ] Demo recording/playback
- [ ] Netplay support

## References

- [UZDoom Project](https://github.com/UZDoom/UZDoom)
- [Emscripten Documentation](https://emscripten.org)
- [WebAssembly Spec](https://webassembly.org)
- [DOOM WAD Format](https://doomwiki.org/wiki/WAD)
- [PK3 Format](https://doomwiki.org/wiki/PK3)

## License

This integration maintains compatibility with UZDoom's original licensing.
UZDoom is based on GZDoom and maintains the same licensing terms.
