const { app, BrowserWindow, ipcMain, Menu, shell } = require("electron")
const path = require("path")
const { spawn } = require("child_process")

let mainWindow
let airplayServer
let performanceMonitor

// Performance optimizations
app.commandLine.appendSwitch("enable-gpu-rasterization")
app.commandLine.appendSwitch("enable-zero-copy")
app.commandLine.appendSwitch("enable-hardware-acceleration")
app.commandLine.appendSwitch("disable-software-rasterizer")
app.commandLine.appendSwitch("enable-features", "VaapiVideoDecoder")

function createWindow() {
  // Create optimized browser window
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      webSecurity: false,
      experimentalFeatures: true,
    },
    icon: path.join(__dirname, "assets/icon.png"),
    title: "AirPlay Receiver Pro",
    titleBarStyle: "hiddenInset", // macOS style
    vibrancy: "ultra-dark", // macOS blur effect
    backgroundColor: "#f8fafc",
    show: false, // Don't show until ready
  })

  // Load the optimized app
  mainWindow.loadFile("index.html")

  // Show window when ready to prevent visual flash
  mainWindow.once("ready-to-show", () => {
    mainWindow.show()

    // Focus window
    if (process.platform === "darwin") {
      app.dock.show()
    }
  })

  // Performance optimizations
  mainWindow.webContents.on("dom-ready", () => {
    // Inject performance CSS
    mainWindow.webContents.insertCSS(`
      * {
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }
      
      video {
        transform: translateZ(0);
        -webkit-transform: translateZ(0);
        backface-visibility: hidden;
        -webkit-backface-visibility: hidden;
      }
    `)
  })

  // Open DevTools in development
  if (process.argv.includes("--dev")) {
    mainWindow.webContents.openDevTools()
  }

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: "deny" }
  })

  // Handle window closed
  mainWindow.on("closed", () => {
    mainWindow = null
    if (airplayServer) {
      airplayServer.kill()
    }
  })

  // Start performance monitoring
  startPerformanceMonitoring()
}

function startPerformanceMonitoring() {
  performanceMonitor = setInterval(() => {
    const memoryUsage = process.memoryUsage()
    const cpuUsage = process.cpuUsage()

    // Send performance data to renderer
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("performance-update", {
        memory: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
        cpu: Math.round((cpuUsage.user + cpuUsage.system) / 1000), // ms
        timestamp: Date.now(),
      })
    }
  }, 1000)
}

// App event handlers with optimizations
app.whenReady().then(() => {
  createWindow()

  // macOS dock icon
  if (process.platform === "darwin") {
    app.dock.setIcon(path.join(__dirname, "assets/icon.png"))
  }
})

app.on("window-all-closed", () => {
  if (performanceMonitor) {
    clearInterval(performanceMonitor)
  }

  if (process.platform !== "darwin") {
    app.quit()
  }
})

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// Optimized IPC handlers
ipcMain.handle("start-airplay-server", async (event, config) => {
  try {
    console.log("🚀 Starting optimized AirPlay server...")

    // Start the optimized server process
    airplayServer = spawn("node", ["scripts/optimized-airplay-server.js"], {
      env: {
        ...process.env,
        DEVICE_NAME: config.deviceName,
        QUALITY: config.quality,
        FRAME_RATE: config.frameRate,
      },
      stdio: ["pipe", "pipe", "pipe"],
    })

    // Handle server output with performance logging
    airplayServer.stdout.on("data", (data) => {
      const message = data.toString()
      console.log(`Server: ${message}`)

      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send("server-log", {
          message: message.trim(),
          timestamp: Date.now(),
          type: "info",
        })
      }
    })

    airplayServer.stderr.on("data", (data) => {
      const error = data.toString()
      console.error(`Server Error: ${error}`)

      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send("server-log", {
          message: error.trim(),
          timestamp: Date.now(),
          type: "error",
        })
      }
    })

    airplayServer.on("close", (code) => {
      console.log(`Server process exited with code ${code}`)
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send("server-stopped", { code })
      }
    })

    return { success: true, message: "Optimized AirPlay server started" }
  } catch (error) {
    console.error("Failed to start server:", error)
    return { success: false, message: error.message }
  }
})

ipcMain.handle("stop-airplay-server", async () => {
  try {
    if (airplayServer) {
      airplayServer.kill("SIGTERM")
      airplayServer = null
    }
    return { success: true, message: "AirPlay server stopped" }
  } catch (error) {
    return { success: false, message: error.message }
  }
})

// Build executable handler
ipcMain.handle("build-executable", async () => {
  try {
    console.log("🔨 Building optimized executable...")

    const { exec } = require("child_process")

    return new Promise((resolve, reject) => {
      exec("npm run build-win", (error, stdout, stderr) => {
        if (error) {
          console.error("Build error:", error)
          reject({ success: false, message: error.message })
        } else {
          console.log("Build output:", stdout)
          resolve({
            success: true,
            message: "Executable built successfully!",
            output: stdout,
          })
        }
      })
    })
  } catch (error) {
    return { success: false, message: error.message }
  }
})

// Create optimized application menu
const template = [
  {
    label: "AirPlay Receiver Pro",
    submenu: [
      {
        label: "About AirPlay Receiver Pro",
        role: "about",
      },
      { type: "separator" },
      {
        label: "Preferences...",
        accelerator: "CmdOrCtrl+,",
        click: () => {
          // Open preferences
        },
      },
      { type: "separator" },
      {
        label: "Hide AirPlay Receiver Pro",
        accelerator: "Command+H",
        role: "hide",
      },
      {
        label: "Hide Others",
        accelerator: "Command+Alt+H",
        role: "hideothers",
      },
      {
        label: "Show All",
        role: "unhide",
      },
      { type: "separator" },
      {
        label: "Quit",
        accelerator: "CmdOrCtrl+Q",
        click: () => app.quit(),
      },
    ],
  },
  {
    label: "Server",
    submenu: [
      {
        label: "Start AirPlay Server",
        accelerator: "CmdOrCtrl+S",
        click: () => {
          mainWindow.webContents.send("menu-start-server")
        },
      },
      {
        label: "Stop AirPlay Server",
        accelerator: "CmdOrCtrl+T",
        click: () => {
          mainWindow.webContents.send("menu-stop-server")
        },
      },
      { type: "separator" },
      {
        label: "Performance Monitor",
        accelerator: "CmdOrCtrl+P",
        click: () => {
          mainWindow.webContents.send("toggle-performance-monitor")
        },
      },
    ],
  },
  {
    label: "View",
    submenu: [
      { role: "reload" },
      { role: "forceReload" },
      { role: "toggleDevTools" },
      { type: "separator" },
      { role: "resetZoom" },
      { role: "zoomIn" },
      { role: "zoomOut" },
      { type: "separator" },
      { role: "togglefullscreen" },
    ],
  },
  {
    label: "Window",
    submenu: [{ role: "minimize" }, { role: "close" }, { type: "separator" }, { role: "front" }],
  },
]

Menu.setApplicationMenu(Menu.buildFromTemplate(template))

// Handle app protocol for deep linking
app.setAsDefaultProtocolClient("airplay-receiver")
