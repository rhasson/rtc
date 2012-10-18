var fs = require('fs');
var e = require('express');
var s = e();
var BServer = require('binaryjs').BinaryServer;
var bs = BServer({port: 9000});

s.use(e.static(__dirname));

s.listen(8080, 'localhost');

bs.on('connection', function(client) {
	console.log('connected', client);
	client.on('error', function(err) {
		console.log('error: ', e.stack, e.message);
	});

	var count = 0;
	client.on('stream', function(stream, meta) {
		if (meta.type === 'write') {
			count++;
			//var f = fs.createWriteStream(__dirname + '/pic'+count+'.png');
			//stream.pipe(f);
			console.log(stream);
		}
	});
});

