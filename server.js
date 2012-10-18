var fs = require('fs'),
	express = require('express'),
	server = express(),
	BServer = require('binaryjs').BinaryServer,
	bs = BServer({port: 9000}),
	Canvas = require('canvas'),
	Image = Canvas.Image;

server.use(express.static(__dirname));

server.listen(8080, 'localhost');

bs.on('connection', function(client) {
	console.log('Client connected');
	client.on('error', function(err) {
		console.log('error: ', err.stack, err.message);
	});

	var count = 1;
	client.on('stream', function(stream, meta) {
		
		stream.on('data', function(data) {
			console.log('Stream data');
			//var f = fs.createWriteStream(__dirname + '/pic'+count+'.png');
			//f.end(data);
			console.log(data);
			count++;
		});
		stream.on('end', function() {
			console.log('Stream ended');
		});
	});
});

