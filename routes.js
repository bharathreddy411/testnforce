var nforce = require('nforce');
var path = require('path');

module.exports = function (app, express) {

    /*function oauthCallbackUrl(req) {
        return req.protocol + '://' + req.get('host');
    }*/

    var org = nforce.createConnection({
        clientId: '3MVG9d8..z.hDcPIb2fqh30hpJyk.RNUR9i04wYTSzQ2Bf3eHaL2rBpvRX83shIHMLtCj6y1FwxxvN5qDC5HI', //process.env.CONSUMER_KEY,
        clientSecret: '6104269296384969470',//process.env.CONSUMER_SECRET,
        redirectUri: 'https://qikforce.herokuapp.com',//'http://localhost:5000',//oauthCallbackUrl(req),
        mode: 'multi'
    });

    var baseurl = '/services/data/v42.0';

    var oauth;

    app.get('/', function (req, res) {
        if (req.query.code !== undefined) {
            // authenticated
            org.authenticate(req.query, function (err, auth) {
                // console.log(auth);
                if (!err) {
                    oauth = auth;
                    //res.redirect('/index');
                    console.log(auth);
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

    app.get('/getnamespace', function (req, res) {
        org.getUrl({
            url: baseurl + '/query/?q=SELECT+NamespacePrefix+FROM+Organization',
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
            url: baseurl + '/wave/folders',
            oauth: oauth
        }, function (err, response) {
            if (err) {
                res.send(err);
            } else {
                res.send(response);
            }
        });
    });

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

    app.post('/getalldatasets', function (req, res) {
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
            url: baseurl + '/sobjects',
            oauth: oauth
        }, function (err, response) {
            if (err) {
                res.send(err);
            } else {
                res.send(response);
            }
        });
    });

    app.get('/getidentity', function (req, res) {
        org.getIdentity({
            oauth: oauth
        }, function (err, response) {
            if (err) {
                res.send(err);
            } else {
                res.send(response);
            }
        });
    });

    app.post('/getsavedconfigs', function (req, res) {
        org.getUrl({
            url: baseurl + '/query/?q=' + req.body.query,
            oauth: oauth
        }, function (err, response) {
            if (err) {
                res.send(err);
            } else {
                res.send(response);
            }
        });
    });

    app.get('/dataflows', function (req, res) {
        org.getUrl({
            url: baseurl + '/wave/dataflows',
            oauth: oauth
        }, function (err, response) {
            if (err) {
                res.send(err);
            } else {
                res.send(response);
            }
        });
    });

    app.post('/uploaddashboards', function (req, res) {
        org.postUrl({
            url: baseurl + '/wave/dashboards',
            oauth: oauth,
            body: req.body
        }, function (err, response) {
            if (err) {
                res.send(err);
            } else {
                res.send(response);
            }
        });
    });

    app.post('/downloaddataflows', function (req, res) {
        org.getUrl({
            url: '/insights/internal_api/v1.0/esObject/workflow/' + req.body.dataflowid + '/json',
            oauth: oauth
        }, function (err, response) {
            if (err) {
                res.send(err);
            } else {
                res.send(response);
            }
        });
    });

    app.get('/checkiftouchpermissionsetexists', function (req, res) {
        org.getUrl({
            url: baseurl + "/query/?q=SELECT+Id,Name+FROM+PermissionSet+WHERE+Name+=+'Admin_Permission_Sets'",
            oauth: oauth
        }, function (err, response) {
            if (err) {
                res.send(err);
            } else {
                res.send(response);
            }
        });
    });

    app.get('/getFieldPermissionsParentId', function (req, res) {
        org.getUrl({
            url: baseurl + "/query/?q=SELECT+Id+FROM+PermissionSet+WHERE+Profile.Name+=+'System+Administrator'",
            oauth: oauth
        }, function (err, response) {
            if (err) {
                res.send(err);
            } else {
                res.send(response);
            }
        });
    });

    app.get('/getPermissionSets', function (req, res) {
        org.getUrl({
            url: baseurl + "/query/?q=SELECT+Id+FROM+PermissionSet+WHERE+Profile.Name+=+'System+Administrator'",
            oauth: oauth
        }, function (err, response) {
            if (err) {
                res.send(err);
            } else {
                res.send(response);
            }
        });
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

};