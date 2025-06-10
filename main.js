const { app, BrowserWindow, ipcMain, Menu, shell } = require("electron")
const path = require("path")
const { spawn } = require("child_process")

let mainWindow
let airplayServer

// Performance optimizations
app.commandLine.appendSwitch("enable-gpu-rasterization")
app.commandLine.appendSwitch("enable-zero-copy")
app.commandLine.appendSwitch("enable-hardware-acceleration")

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false,
    },
    icon: path.join(__dirname, "build/icon.png"),
    title: "AirPlay Receiver Pro",
    backgroundColor: "#f8fafc",
    show: false,
  })

  // Load the app
  mainWindow.loadFile("index.html")

  // Show when ready
  mainWindow.once("ready-to-show", () => {
    mainWindow.show()
  })

  // Development tools
  if (process.argv.includes("--dev")) {
    mainWindow.webContents.openDevTools()
  }

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: "deny" }
  })

  mainWindow.on("closed", () => {
    mainWindow = null
    if (airplayServer) {
      airplayServer.kill()
    }
  })
}

app.whenReady().then(createWindow)

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit()
  }
})

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// IPC handlers
ipcMain.handle("start-airplay-server", async (event, config) => {
  try {
    console.log("Starting AirPlay server...")

    // In a real implementation, you would start the actual AirPlay server here
    // For now, we'll simulate it

    return { success: true, message: "AirPlay server started" }
  } catch (error) {
    return { success: false, message: error.message }
  }
})

ipcMain.handle("stop-airplay-server", async () => {
  try {
    if (airplayServer) {
      airplayServer.kill()
      airplayServer = null
    }
    return { success: true, message: "AirPlay server stopped" }
  } catch (error) {
    return { success: false, message: error.message }
  }
})

ipcMain.handle("build-executable", async () => {
  try {
    const { exec } = require("child_process")

    return new Promise((resolve) => {
      exec("npm run build-win", (error, stdout, stderr) => {
        if (error) {
          resolve({ success: false, message: error.message })
        } else {
          resolve({ success: true, message: "Build completed successfully!" })
        }
      })
    })
  } catch (error) {
    return { success: false, message: error.message }
  }
})

// Create menu
const template = [
  {
    label: "File",
    submenu: [
      {
        label: "Start Server",
        accelerator: "CmdOrCtrl+S",
        click: () => mainWindow.webContents.send("menu-start-server"),
      },
      {
        label: "Stop Server",
        accelerator: "CmdOrCtrl+T",
        click: () => mainWindow.webContents.send("menu-stop-server"),
      },
      { type: "separator" },
      { role: "quit" },
    ],
  },
  {
    label: "View",
    submenu: [
      { role: "reload" },
      { role: "toggleDevTools" },
      { type: "separator" },
      { role: "resetZoom" },
      { role: "zoomIn" },
      { role: "zoomOut" },
      { type: "separator" },
      { role: "togglefullscreen" },
    ],
  },
]

Menu.setApplicationMenu(Menu.buildFromTemplate(template))
