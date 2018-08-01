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
          res.send({ "totalStars": result, "source": "redis cache" });
        } else {
            
          
          
          getuserrepo(username)
            .then(countstars)
            .then(function(totalStars) {
              client.setex(username, 60, totalStars);
              res.send({ "totalStars": totalStars, "source": "GitHub API" });
            }).catch(function(response) {
              if (response.status === 404){
                res.send('The GitHub username could not be found. Try "coligo-io" as an example!');
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