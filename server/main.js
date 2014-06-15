var express = require('express'),
    app = express(),
    compression = require('compression'),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server),
    fs = require('fs'),
    os = require('os');

var staticDir = __dirname + "/../client";
var imageDir = os.tmpdir() + "struttura";
var port = 8080;

fs.mkdir(imageDir, function(err) {
	if (err.code != "EEXIST") {
		throw err;
	}
});

console.log("Serving files from " + staticDir + " on port " + port + "...");

app.use(compression({
	threshold: 5000
}));

app.use(express.static(staticDir, { maxAge: -1 }));

server.listen(port);

io.sockets.on('connection', function (socket) {
    socket.on('render-frame', function (data) {
        data.file = data.file.split(',')[1]; // Get rid of the data:image/png;base64 at the beginning of the file data
        var buffer = new Buffer(data.file, 'base64');
        var filename = imageDir + '/pattern-' + socket.id + '_' + data.frame + '.png';
        fs.writeFile(
        	filename, 
        	buffer.toString('binary'), 
        	{ encoding: 'binary' },
        	function (err) {
        		if (err) throw err;
        		console.log("Saved " + filename);
        	});
    });
});
