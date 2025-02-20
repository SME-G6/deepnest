const { app, ipcMain, BrowserWindow, screen } = require("electron");
const remote = require("@electron/remote/main");
const fs = require("graceful-fs");
const path = require("path");
const os = require("os");
const url = require("url");

remote.initialize();
app.commandLine.appendSwitch("--enable-precise-memory-info");

/*
// macOS Menu Template
const isMac = process.platform === "darwin";

const template = [
  ...(isMac
    ? [
        {
          label: app.name,
          submenu: [
            { role: "about" },
            { type: "separator" },
            { role: "services", submenu: [] },
            { type: "separator" },
            { role: "hide" },
            { role: "hideothers" },
            { role: "unhide" },
            { type: "separator" },
            { role: "quit" },
          ],
        },
      ]
    : []),
  {
    label: "File",
    submenu: [isMac ? { role: "close" } : { role: "quit" }],
  },
  {
    label: "Edit",
    submenu: [
      { role: "undo" },
      { role: "redo" },
      { type: "separator" },
      { role: "cut" },
      { role: "copy" },
      { role: "paste" },
      { role: "pasteandmatchstyle" },
      { role: "delete" },
      { role: "selectall" },
    ],
  },
  {
    label: "View",
    submenu: [
      { role: "reload" },
      { role: "forcereload" },
      { role: "toggledevtools" },
      { type: "separator" },
      { role: "resetzoom" },
      { role: "zoomin" },
      { role: "zoomout" },
      { type: "separator" },
      { role: "togglefullscreen" },
    ],
  },
  {
    label: "Window",
    submenu: [
      { role: "minimize" },
      { role: "zoom" },
      ...(isMac
        ? [{ type: "separator" }, { role: "front" }, { type: "separator" }, { role: "window" }]
        : [{ role: "close" }]),
    ],
  },
  {
    role: "help",
    submenu: [
      {
        label: "Learn More",
        click: async () => {
          const { shell } = require("electron");
          await shell.openExternal("https://electronjs.org");
        },
      },
    ],
  },
]; 
*/

//  Global Variables 
let mainWindow = null;
var backgroundWindows = [];

// single instance lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", (event, commandLine, workingDirectory) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
  app.whenReady().then(() => {
    //myWindow = createWindow()
  });
}

// Window Management 
function createMainWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  var frameless = process.platform == "darwin";

  mainWindow = new BrowserWindow({
    width: Math.ceil(width * 0.9),
    height: Math.ceil(height * 0.9),
    frame: !frameless,
    show: false,
    webPreferences: {
      contextIsolation: false,
      enableRemoteModule: true,
      nodeIntegration: true,
      nativeWindowOpen: true,
    },
  });

  remote.enable(mainWindow.webContents);

  mainWindow.loadURL(
    url.format({
      pathname: path.join(__dirname, "./main/index.html"),
      protocol: "file:",
      slashes: true,
    })
  );
  
  mainWindow.setMenu(null);

  if (process.env["deepnest_debug"] === "1")
    mainWindow.webContents.openDevTools();

  mainWindow.on("closed", function () {
    mainWindow = null;
  });

  if (process.env.SAVE_PLACEMENTS_PATH !== undefined) {
    global.NEST_DIRECTORY = process.env.SAVE_PLACEMENTS_PATH;
  } else {
    global.NEST_DIRECTORY = path.join(os.tmpdir(), "nest");
  }

  // make sure the export directory exists and handle any errors that may occur
  if (!fs.existsSync(global.NEST_DIRECTORY)) {
  try {
    fs.mkdirSync(global.NEST_DIRECTORY, { recursive: true });
    console.log(`Directory created: ${global.NEST_DIRECTORY}`);
  } catch (error) {
    console.error(`Error creating directory: ${error.message}`);
  }
 }
}

let winCount = 0;

function createBackgroundWindows() {
  if (winCount < 1) {
    var back = new BrowserWindow({
      show: false,
      webPreferences: {
        contextIsolation: false,
        enableRemoteModule: true,
        nodeIntegration: true,
        nativeWindowOpen: true,
      },
    });

    remote.enable(back.webContents);

    if (process.env["deepnest_debug"] === "1") back.webContents.openDevTools();

    back.loadURL(
      url.format({
        pathname: path.join(__dirname, "./main/background.html"),
        protocol: "file:",
        slashes: true,
      })
    );

    backgroundWindows[winCount] = back;

    back.once("ready-to-show", () => {
      winCount++;
      createBackgroundWindows();
    });
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", () => {
  createMainWindow();
  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
    createBackgroundWindows();
  });
  mainWindow.on("closed", () => {
    app.quit();
  });
});

// Quit when all windows are closed.
app.on("window-all-closed", function () {
  app.quit();
});

app.on("activate", function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createMainWindow();
  }
});

app.on("before-quit", function () {
  var p = path.join(__dirname, "./nfpcache");
  if (fs.existsSync(p)) {
    fs.readdirSync(p).forEach(function (file, index) {
      var curPath = p + "/" + file;
      fs.unlinkSync(curPath);
    });
  }
});

//ipcMain.on('background-response', (event, payload) => mainWindow.webContents.send('background-response', payload));
//ipcMain.on('background-start', (event, payload) => backgroundWindows[0].webContents.send('background-start', payload));

ipcMain.on("background-start", function (event, payload) {
  console.log("starting background!");
  for (var i = 0; i < backgroundWindows.length; i++) {
    if (backgroundWindows[i] && !backgroundWindows[i].isBusy) {
      backgroundWindows[i].isBusy = true;
      backgroundWindows[i].webContents.send("background-start", payload);
      break;
    }
  }
});

ipcMain.on("background-response", function (event, payload) {
  for (var i = 0; i < backgroundWindows.length; i++) {
    // todo: hack to fix errors on app closing - should instead close workers when window is closed
    try {
      if (backgroundWindows[i].webContents == event.sender) {
        mainWindow.webContents.send("background-response", payload);
        backgroundWindows[i].isBusy = false;
        break;
      }
    } catch (ex) {
      // ignore errors, as they can reference destroyed objects during a window close event
    }
  }
});

ipcMain.on("background-progress", function (event, payload) {
  // todo: hack to fix errors on app closing - should instead close workers when window is closed
  try {
    mainWindow.webContents.send("background-progress", payload);
  } catch (ex) {
    // when shutting down while processes are running, this error can occur so ignore it for now.
  }
});

ipcMain.on("background-stop", function (event) {
  for (var i = 0; i < backgroundWindows.length; i++) {
    if (backgroundWindows[i]) {
      backgroundWindows[i].destroy();
      backgroundWindows[i] = null;
    }
  }
  winCount = 0;

  createBackgroundWindows();

  console.log("stopped!", backgroundWindows);
});

// Backward compat with https://electron-settings.js.org/index.html#configure
const configPath = path.resolve(app.getPath("userData"), "settings.json");
ipcMain.handle("read-config", () => {
  return fs.existsSync(configPath)
    ? JSON.parse(fs.readFileSync(configPath).toString())
    : {};
});
ipcMain.handle("write-config", (event, stringifiedConfig) => {
  fs.writeFileSync(configPath, stringifiedConfig);
});

ipcMain.on("login-success", function (event, payload) {
  mainWindow.webContents.send("login-success", payload);
});

ipcMain.on("purchase-success", function (event) {
  mainWindow.webContents.send("purchase-success");
});

ipcMain.on("setPlacements", (event, payload) => {
  global.exportedPlacements = payload;
});

ipcMain.on("test", (event, payload) => {
  global.test = payload;
});
