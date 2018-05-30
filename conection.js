'use strict'

var nforce = require('nforce');

var org = nforce.createConnection({
  clientId: '3MVG9d8..z.hDcPIb2fqh30hpJyk.RNUR9i04wYTSzQ2Bf3eHaL2rBpvRX83shIHMLtCj6y1FwxxvN5qDC5HI', //process.env.CONSUMER_KEY,
  clientSecret: '6104269296384969470',//process.env.CONSUMER_SECRET,
  redirectUri: 'http://localhost:5000',//oauthCallbackUrl(req),
  //apiVersion: 'v34.0',  // optional, defaults to current salesforce API version
  //environment: 'production',  // optional, salesforce 'sandbox' or 'production', production default
  mode: 'single', // optional, 'single' or 'multi' user mode, multi default
  autoRefresh: true
});

org.authenticate(req.query, function(err,auth) {
	if (!err) {
		oauth = auth;
		res.redirect('/index');
		//res.json(auth);			
	}
	else {
	  res.send(err);
	  if (err.message.indexOf('invalid_grant') >= 0) {
		res.redirect('/');
	  }
	  else {
		res.send(err.message);
	  }
	}
  });
}
else {
  res.redirect(org.getAuthUri());
}

module.exports = org;