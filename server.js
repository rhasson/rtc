var e = require('express');
var s = e();

s.use(e.static(__dirname));

s.listen(8080, 'localhost');