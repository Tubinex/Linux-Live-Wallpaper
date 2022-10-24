const { app, BrowserWindow, screen, Tray, Menu, shell, ipcMain } = require('electron');
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
    fs.readdir(wallpaperPath, (err, files) => {

        callback(files);

    });

}

var wallpaperPicker;
var wallpaperWindow;

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

    console.log(data);
    config.src = data.src;
    saveConfig();

    wallpaperWindow.webContents.send('change-wallpaper', {
        type: 'video',
        src: `file:///${config.src}`
    });

});

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
        type: 'desktop'
    });
    wallpaperWindow.setMenu(null);
    wallpaperWindow.loadFile(path.join(__dirname, 'assets', 'html', 'wallpaper.html'));
    wallpaperWindow.setSkipTaskbar(true);
    wallpaperWindow.setPosition(0, 0);
    wallpaperWindow.setBackgroundColor('black');

    wallpaperWindow.on('ready-to-show', () => {

        getWallpapers((wallpapers) => {
            if (config.src == null){

                config.src = path.join(wallpaperPath, wallpapers[Math.floor(Math.random() * wallpapers.length)]);

            }
            wallpaperWindow.webContents.send('change-wallpaper', {
                type: 'video',
                src: `file:///${config.src}`
            });
        });
    });
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