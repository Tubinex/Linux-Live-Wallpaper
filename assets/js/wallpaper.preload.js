const { ipcRenderer } = require('electron')

ipcRenderer.on('change-wallpaper', (event, data) => {

	document.getElementsByTagName('video')[0].setAttribute('src', data.src);

});

ipcRenderer.on('pause', (event, data) => {

	document.getElementsByTagName('video')[0].pause()

});

ipcRenderer.on('resume', (event, data) => {

	document.getElementsByTagName('video')[0].play()

});

window.addEventListener('DOMContentLoaded', () => {

	document.getElementsByClassName('button')[0].addEventListener('click', () => {

		ipcRenderer.send("open-wallpaper-folder");

	});

});

