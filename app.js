var app = require('express')();
var responseTime = require('response-time')
var axios = require('axios');
var redis = require('redis');
var http=require('http');


var client = redis.createClient();
client.on('error',function(err){
    console.log(err);
});

app.set('port',(3000));

app.use(responseTime());

function getuserrepo(username){
    var url='http://api.github.com/users/'+username+'/repos'+'?per_page=50';
    return axios.get(url);

}

function countstars(repo){
    return repo.data.reduce(function(total,currval){
        return total+currval.stargazers_count;
    },0);
}


app.get('/api/:username', function(req, res) {
    var username = req.params.username;
    client.get(username, function(error, result) {
        if (result) {
          res.send({ "stars": result, "from": "redis cache" });
        } else {
            
          
          
          getuserrepo(username)
            .then(countstars)
            .then(function(stars) {
              client.setex(username, 300, stars);
              res.send({ "stars": stars, "from": "GitHubs API" });
            }).catch(function(response) {
              if (response.status === 404){
                res.send('username not found');
              } else {
                res.send(response);
              }
            });
        }
  
    });
  });
            

app.listen(app.get('port'),function(){
    console.log("listening on ",app.get('port'));
});