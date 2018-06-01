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

require("./routes")(app, express);


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