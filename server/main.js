var express = require('express'),
    app = express(),
    compression = require('compression'),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server),
    fs = require('fs'),
    os = require('os'),
    gm = require('gm');

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

tiles = {};

io.sockets.on('connection', function (socket) {
    socket.on('save-tile', function (data) {
        data.file = data.file.split(',')[1]; // Get rid of the data:image/png;base64 at the beginning of the file data
        var buffer = new Buffer(data.file, 'base64');

        var prefix = imageDir + '/pattern-' + socket.id + '_' + data.imageId
        var filename = prefix + '_' + data.x + '_' + data.y + '.png';
        fs.writeFile(
            filename, 
            buffer.toString('binary'), 
            { encoding: 'binary' },
            function (err) {
                if (err) throw err;
                console.log("Saved " + filename);

                if (!(data.imageId in tiles)) {
                    tiles[data.imageId] = [];
                }

                tiles[data.imageId].push(filename);

                if (tiles[data.imageId].length == data.w * data.h) {
                    // we have all the tiles
                    console.log("Assembling " + prefix + "* into complete image...");

                    var y = 0, x = 1, fy = 1;
                    function processNext() {
                        if (y < data.h) {
                            var rowFile = prefix + '_0_' + y + '.png';
                            if (x < data.w) {
                                gm(rowFile).append(prefix + '_' + x++ + '_' + y + '.png', true).write(rowFile, processNext);
                            } else {
                                x = 1;
                                y++;
                                processNext();
                            }
                        } else {
                            var finalFile = prefix + '_0_0.png';
                            if (fy < data.h) {
                                gm(finalFile).append(prefix + '_0_' + fy++ + '.png').write(finalFile, processNext);
                            } else {
                                // all done, cleanup 
                                console.log("Writing " + prefix + ".png...");
                                gm(finalFile).write(prefix + '.png', function() {
                                    tiles[data.imageId].forEach(function (file) { fs.unlinkSync(file); });
                                    delete tiles[data.imageId];
                                });
                            }
                        }
                    }
                    processNext();
                }
            }
        );
    });
});
