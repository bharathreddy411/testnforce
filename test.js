var nforce = require('nforce');
var express = require('express');
var org = nforce.createConnection({
    clientId: '3MVG9d8..z.hDcPIb2fqh30hpJyk.RNUR9i04wYTSzQ2Bf3eHaL2rBpvRX83shIHMLtCj6y1FwxxvN5qDC5HI', //process.env.CONSUMER_KEY,
  clientSecret: '6104269296384969470',//process.env.CONSUMER_SECRET,
    redirectUri: 'http://localhost:3000/auth/sfdc/callback'
  });
//org.getAuthUri();
var app = express();
app.set('public', __dirname + '/public');
//app.set('view engine', 'ejs');
//app.use(require('cookie-parser')());
//app.use(require('body-parser').urlencoded({
 //   extended: true
//}));

app.get('/auth/sfdc', function (req, res) {
    res.redirect(org.getAuthUri( {responseType:'code'}));
});

app.get('/auth/sfdc/callback', function (req, res) {
    org.authenticate({ code: req.query.code }, function (err, resp) {
        if (!err) {
                res.send(resp);
                console.log('Access Token: ' + resp.access_token);
            } else {
                console.log('Error: ' + err.message);
            }
        });
});


app.listen(3000);