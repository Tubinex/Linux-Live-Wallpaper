const { ipcRenderer } = require('electron')

ipcRenderer.on('load-wallpapers', (event, data) => {

	const list = document.getElementsByClassName('wallpaper-list')[0];
	data.wallpapers.forEach((w) => {

		const wp = document.createElement('div');
		wp.classList.add('wallpaper');
		wp.innerHTML = `
		<div class="preview">
			<video loop muted src="${w.src}"></video>
		</div>
		<div class="name">${w.name}</div>
		`
		list.appendChild(wp)

		wp.addEventListener('mouseenter', () => {

			wp.getElementsByTagName('video')[0].play();

		});

		wp.addEventListener('mouseleave', () => {

			wp.getElementsByTagName('video')[0].pause();

		});

		wp.addEventListener('click', () => {

			ipcRenderer.send('set-wallpaper', {
				src: w.src
			})

		});

	});

});
