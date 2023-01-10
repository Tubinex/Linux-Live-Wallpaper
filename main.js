const { app, BrowserWindow, screen, Tray, Menu, shell, ipcMain, dialog } = require('electron');
const child_process = require('child_process');
const fs = require('fs');
const path = require('path')

const wallpaperPath = path.join(app.getPath("userData"), 'Wallpapers');
const configPath = path.join(app.getPath("userData"), 'config.json');

var config = {
    src: null
}

const lock = app.requestSingleInstanceLock();
if (!lock){app.quit()}

const loadConfig = () => {

    if (fs.existsSync(configPath)){

        config = JSON.parse(fs.readFileSync(configPath));
        return config;

    } else {
        return {
            src: null
        }
    }

}

const saveConfig = () => {

    fs.writeFileSync(configPath, JSON.stringify(config, '\t'))

}

if (!fs.existsSync(wallpaperPath)){
    fs.mkdirSync(wallpaperPath);
}

config = loadConfig();

const getWallpapers = (callback) => {

    console.log(wallpaperPath);
    if (fs.existsSync(wallpaperPath)){
        fs.readdir(wallpaperPath, (err, files) => {

            callback(files);
    
        });
    } else {
        
        callback([]);

    }

}

var wallpaperPicker;
var wallpaperWindow;
var wallpaperPaused = false;

const makeTray = () => {

    const tray = new Tray(path.join(__dirname, 'assets', 'imgs', 'icon.png'));
    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Show',
            click: () => {
                wallpaperPicker.show();
            },
        },
        {
            label: 'Wallpapers',
            click: () => {
                shell.openPath(wallpaperPath);
            },
        },
        {
            label: 'Import',
            click: () => {
                dialog.showOpenDialog({
                    properties: ['openFile'],
                    filters: [
                        { name: "Movies", extensions: ["mkv", "avi", "mp4"] }
                    ],
                }).then(function (response) {
                    if (!response.canceled) {
                        console.log(response.filePaths[0]);
                        fs.copyFileSync(response.filePaths[0], path.join(wallpaperPath, path.basename(response.filePaths[0])));
                    }
                });
            }
        },
        {
            type: 'separator'
        },
        {
            label: 'Quit',
            click: () => {
                app.isQuiting = true;
                app.quit();
            },
        },
    ]);

    tray.setContextMenu(contextMenu);
    tray.setToolTip('Desktop Client');
    tray.setTitle('Desktop Client');

}

ipcMain.on('set-wallpaper', (event, data) => {

    config.src = data.src;
    saveConfig();

    wallpaperWindow.webContents.send('change-wallpaper', {
        type: 'video',
        src: `file:///${config.src}`
    });

});

ipcMain.on('open-wallpaper-folder', (event, data) => {

    shell.openPath(wallpaperPath);

});

ipcMain.on('print', (event, data) => {

    console.log(data);

})

const createWallpaperPicker = () => {

    wallpaperPicker = new BrowserWindow({
        minWidth: 880,
        minHeight: 500,
        webPreferences: {
            preload: path.join(__dirname, 'assets', 'js', 'picker.preload.js'),
            webSecurity: false
        },
        show: false
    });
    wallpaperPicker.setMenu(null);
    wallpaperPicker.loadFile(path.join(__dirname, 'assets', 'html', 'picker.html'));
    wallpaperPicker.setTitle("Wallpapers");
    wallpaperPicker.setBackgroundColor('black');

    wallpaperPicker.on('ready-to-show', () => {

        getWallpapers((wallpapers) => {

            const paths = [];
            wallpapers.forEach((w) => {
                paths.push({
                    src: path.join(wallpaperPath, w),
                    name: w.split('.')[0].replaceAll('-', ' ')
                });
            })

            wallpaperPicker.webContents.send('load-wallpapers', {
                wallpapers: paths
            });
        });

    });

    wallpaperPicker.on('minimize',function(event){
        event.preventDefault();
        wallpaperPicker.hide();
    });

    wallpaperPicker.on('close', function (event) {
        if(!app.isQuiting){
            event.preventDefault();
            wallpaperPicker.hide();
        }
    
        return false;
    });

}

const createWallpaperWindow = () => {

    const primaryDisplay = screen.getPrimaryDisplay();

    wallpaperWindow = new BrowserWindow({
        width: primaryDisplay.bounds.width + 5,
        height: primaryDisplay.bounds.height + 5,
        transparent: true,
        webPreferences: {
            preload: path.join(__dirname, 'assets', 'js', 'wallpaper.preload.js'),
            webSecurity: false
        },
        type: 'desktop',
        show: false
    });
    wallpaperWindow.setMenu(null);
    wallpaperWindow.loadFile(path.join(__dirname, 'assets', 'html', 'wallpaper.html'));
    wallpaperWindow.setSkipTaskbar(true);
    wallpaperWindow.setPosition(0, 0);
    wallpaperWindow.setBackgroundColor('black');

    wallpaperWindow.on('ready-to-show', () => {

        wallpaperWindow.showInactive()
        getWallpapers((wallpapers) => {
            if (config.src == null && wallpapers.length > 0){

                config.src = path.join(wallpaperPath, wallpapers[Math.floor(Math.random() * wallpapers.length)]);

            }
            if (config.src != null && fs.existsSync(config.src)){
                wallpaperWindow.webContents.send('change-wallpaper', {
                    type: 'video',
                    src: `file:///${config.src}`
                });
            }
        });
    });

    wallpaperWindow.on('minimize', () => wallpaperWindow.maximize());

}

app.whenReady().then(() => {

    createWallpaperWindow();
    createWallpaperPicker();
    makeTray();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWallpaperWindow()
    })
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
});

setInterval(() => {

    const primaryDisplay = screen.getPrimaryDisplay();

    child_process.exec('xdotool getwindowfocus getwindowgeometry --shell', (err, stdout, stderr) => {
        const wininfo = stdout.split('\n');
        const info = {}
        wininfo.forEach((set) => {

            const key = set.split('=')[0];
            const val = set.split('=')[1];

            try {
                if (key && val) info[key] = parseInt(val);
            } catch (ignored){}
            
        });

        if (info.WIDTH === primaryDisplay.workAreaSize.width){

            if (!wallpaperPaused) {

                wallpaperWindow.webContents.send('pause');
                wallpaperPaused = true;

            }

        } else {

            if (wallpaperPaused) {

                setTimeout(() => wallpaperWindow.webContents.send('resume'));
                wallpaperPaused = false;

            }
                
        }
        
    });
}, 500);
/*
{
  absolute_upper_left_x: '0',
  absolute_upper_left_y: '58',
  relative_upper_left_x: '1',
  relative_upper_left_y: '31',
  width: '1920',
  height: '1022',
  depth: '24',
  visual: '0x21',
  visual_class: 'TrueColor',
  border_width: '0',
  class: 'InputOutput',
  colormap: '0x20 (installed)',
  bit_gravity_state: 'NorthWestGravity',
  window_gravity_state: 'NorthWestGravity',
  backing_store_state: 'NotUseful',
  save_under_state: 'no',
  map_state: 'IsViewable',
  override_redirect_state: 'no',
  corners: '+0+58  -0+58  -0-0  +0-0',
  id: '0x3c00003',
  name: 'main.js - Wallpaper - Visual Studio Code'
}
*/