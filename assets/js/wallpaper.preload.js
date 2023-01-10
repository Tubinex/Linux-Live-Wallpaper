const { ipcRenderer } = require('electron')
let clockInterval;

const setClockInterval = () => {

	const update = () => {

		const now = new Date();

		const widget = document.getElementsByClassName('widget')[0];
		const day = widget.getElementsByClassName('day-name')[0];
		const date = widget.getElementsByClassName('date')[0];
		const time = widget.getElementsByClassName('time')[0];

		const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
		const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
		day.innerText = dayNames[now.getDay()];

		var hours = date.getHours();
		var minutes = date.getMinutes();
		var suffix = hours >= 12 ? 'OM' : 'AM';
		hours = hours % 12;
		hours = hours ? hours : 12;
		minutes = minutes < 10 ? '0' + minutes : minutes;
		var strTime = hours + ':' + minutes + suffix;
		
		time.innerText = `-   ${strTime}   -`;
		date.innerText = `${now.getDate()}   ${monthNames[now.getMonth()]},   ${now.getFullYear()}`

	}

	if (clockInterval !== undefined && clockInterval !== null){

		clearInterval(clockInterval);

	}

	update();
	clockInterval = setInterval(() => {

		update();

	}, 1000)

}

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

		ipcRenderer.send('open-wallpaper-folder');

	});

	setClockInterval();

});

