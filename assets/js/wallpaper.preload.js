const { ipcRenderer } = require('electron')

ipcRenderer.on('change-wallpaper', (event, data) => {

	document.getElementsByTagName('video')[0].setAttribute('src', data.src)

});

window.addEventListener('DOMContentLoaded', () => {

	document.getElementsByClassName('button')[0].addEventListener('click', () => {

		ipcRenderer.send("open-wallpaper-folder");

	});

});

