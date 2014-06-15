define(function() {

	var socket = io.connect('http://' + window.location.host);
	var saveCount = 0;
	
	function saveImageTile(dataUrl, imageId, x, y, xCount, yCount) {
		socket.emit('save-tile', {
			imageId: imageId,
            x: x,
            y: y,
            w: xCount,
            h: yCount,
            file: dataUrl
        }); 
	}

	return {
		saveImageTile: saveImageTile
	};
});