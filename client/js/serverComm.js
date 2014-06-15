define([], function() {

	var socket = io.connect('http://' + window.location.host);
	var saveCount = 0;
	
	function saveImage(dataUrl) {
		socket.emit('render-frame', {
            frame: saveCount++,
            file: dataUrl
        }); 
	}

	return {
		saveImage: saveImage
	};
});