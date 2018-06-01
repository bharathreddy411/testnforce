var express = require('express');
var nforce = require('nforce');
var path = require('path');
var bodyParser = require('body-parser');

var app = express();
app.enable('trust proxy');

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({
    extended: true
}));

// parse application/json
app.use(bodyParser.json());

/*function oauthCallbackUrl(req) {
    return req.protocol + '://' + req.get('host');
}*/

var org = nforce.createConnection({
    clientId: '3MVG9d8..z.hDcPIb2fqh30hpJyk.RNUR9i04wYTSzQ2Bf3eHaL2rBpvRX83shIHMLtCj6y1FwxxvN5qDC5HI', //process.env.CONSUMER_KEY,
    clientSecret: '6104269296384969470',//process.env.CONSUMER_SECRET,
    redirectUri: 'https://qikforce.herokuapp.com',//'http://localhost:5000',//oauthCallbackUrl(req),
    mode: 'multi'
});

var oauth;
app.get('/', function (req, res) {
    if (req.query.code !== undefined) {
        // authenticated
        org.authenticate(req.query, function (err, auth) {
            // console.log(auth);
            if (!err) {
                oauth = auth;
                //res.redirect('/index');
                //res.json(auth);
                res.sendFile(path.join(__dirname + '/public/index.html'));
            } else {
                if (err.message.indexOf('invalid_grant') >= 0) {
                    res.redirect('/');
                } else {
                    res.send(err.message);
                }
            }
        });
    } else {
        res.redirect(org.getAuthUri());
    }
});

var username = 'bharathreddy848@gmail.com',
    password = 'Bharath1234',
    securityToken = 'o58k2jamXr0klzwKoMb1Uj7N',
    oauth2;
app.get('/anotherorg', function (req, res) {
    org.authenticate({
        username: username,
        password: password,
        securityToken: securityToken
    }, function (err, resp) {
        if (!err) {
            oauth2 = resp;
            res.send(resp);
        } else {
            res.send(err);
        }
    });
});

app.get('/getnamespace', function (req, res) {
    org.getUrl({
        url: '/services/data/v42.0/query/?q=SELECT+NamespacePrefix+FROM+Organization',
        oauth: oauth
    }, function (err, response) {
        if (err) {
            res.send(err);
        } else {
            res.send(response);
        }
    });
});

app.get('/getfolders', function (req, res) {
    org.getUrl({
        url: '/services/data/v42.0/wave/folders',
        oauth: oauth
    }, function (err, response) {
        if (err) {
            res.send(err);
        } else {
            res.send(response);
        }
    });
});

/*app.get('/getdashboards', function (req, res) {
    org.getUrl('/services/data/v42.0/wave/dashboards', function (err, response) {
        if (err) {
            res.send(err);
        } else {
            res.send(response);
        }
    });
});*/

app.post('/getdashboards', function (req, res) {
    org.getUrl({
        url: req.body.url,
        oauth: oauth
    }, function (err, response) {
        if (err) {
            res.send(err);
        } else {
            res.send(response);
        }
    });
});

app.post('/getdashboardmetadata', function (req, res) {
    org.getUrl({
        url: req.body.url,
        oauth: oauth
    }, function (err, response) {
        if (err) {
            res.send(err);
        } else {
            res.send(response);
        }
    });
});

app.get('/getallsobjects', function (req, res) {
    org.getUrl({
        url: '/services/data/v42.0/sobjects',
        oauth: oauth
    }, function (err, response) {
        if (err) {
            res.send(err);
        } else {
            res.send(response);
        }
    });
});


app.use(express.static(path.join(__dirname, 'public')));

/*app.use('/index',function(req,res){
  res.sendFile(path.join(__dirname+'/public/index.html'));
  //__dirname : It will resolve to your project folder.
});*/


// Send all other requests to the Angular app
/*app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});*/

app.listen(process.env.PORT || 5000, function () {
    console.log("listening");
});

module.exports = app;