const { ipcRenderer } = require('electron')

ipcRenderer.on('change-wallpaper', (event, data) => {

	document.getElementsByTagName('video')[0].setAttribute('src', data.src)

});
