var fs = require('fs'),
	express = require('express'),
	server = express(),
	BServer = require('binaryjs').BinaryServer,
	bs = BServer({port: 9000}),
	cv = require('opencv'),
	Classifier = require('classifier'),
	bay = new Classifier.Bayesian();

server.use(express.static(__dirname));

server.listen(8080, 'localhost');

server.get('/train', function(req, res) {
	fs.createReadStream('train.html').pipe(res);
});

bs.on('connection', function(client) {
	console.log('Client connected');
	client.on('error', function(err) {
		console.log('error: ', err.stack, err.message);
	});

	client.on('stream', function(stream, meta) {
		console.log('New stream ', stream.id);

		if (meta.type === 'train') {
			stream.on('data', trainEyes);
		} else if (meta.type === 'check') {
			stream.on('data', checkUser);
		}

		stream.on('end', function() {
			console.log('Stream ', stream.id, ' ended.');
		});
	});
});

function trainEyes(data) {
	var stream = this,
		d = data.replace(/^data:image\/png;base64,/,""),
		buf = new Buffer(d, 'base64');

	detectFeatures(buf, function(err, resp) {
		var answer = resp.score < 20 ? 'no' : 'roy';
		bay.train(resp.score.toString(), answer);
		stream.write(resp);
		stream.end();
	});
}

function checkUser(data) {
	var stream = this,
		count = 0,
		d = data.replace(/^data:image\/png;base64,/,""),
		buf = new Buffer(d, 'base64');

	detectFeatures(buf, function(err, resp) {
		var score = bay.classify(resp.score.toString());
		console.log('score: ', score);
		resp.score = score;
		stream.write(resp);
		stream.end();
	});

}

function detectFeatures(buf, cb) {
	var eyeRoi, face;
	cv.readImage(buf, function(err, img) {
		img.detectObject('./node_modules/opencv/data/haarcascade_frontalface_alt.xml', {}, function(e, faces) {
			console.log('faces: ',faces)
			if (faces.length) {
				face = faces[0];

            	eyeRoi = new cv.Matrix(img, face.x, face.y + (face.height/5.5), face.width, face.height/3.0);
            	eyeRoi.detectObject('./node_modules/opencv/data/haarcascade_eye.xml', {}, function(e1,eyes) {
            		console.log('eyes: ',eyes);
        			var pic = draw(img, eyeRoi, face, eyes);
        			var dis = check(eyes);
        			return cb(null, {img: pic, score: dis});
            	});
			}
		});
	});
}

function draw(img, roi, face, eyes) {
	var png;
		RED = 0x000000ff,
		GREEN = 0x0000ff00;

	for (var i=0; i < eyes.length; i++) {
		var eye = eyes[i];
		roi.ellipse(eye.x + eye.width/2, eye.y + eye.height/2, eye.width/2, eye.height/2, GREEN);  //grow ellipse from the center point out
		roi.ellipse(eye.x + eye.width/2, eye.y + eye.height/2, eye.width/2, eye.height/2, GREEN);
		roi.ellipse(eye.x + eye.width/2, eye.y + eye.height/2, 1, 1, RED);
	}

	img.ellipse(face.x + face.width/2, face.y + face.height/2, face.width/2, face.height/2);

	png = 'data:image/png;base64,' + img.toBuffer().toString('base64');
	return png;
}

function check(eyes) {
	var points = [];
	if (eyes.length === 2) {
		for (var i=0; i < eyes.length; i++) {
			var eye = eyes[i];
			points.push({x: eye.x+eye.width/2, y: eye.y+eye.height/2});
		}
		return distance(points[0].x, points[0].y, points[1].x, points[1].y);
	}
	return 0;
}

function distance(x1, y1, x2, y2) {
	var x = Math.pow(Math.abs(x2 - x1), 2),
		y = Math.pow(Math.abs(y2 - y1), 2),
		dis = Math.sqrt(Math.abs(x + y));

		console.log('distance: ', dis);
	return dis;
}