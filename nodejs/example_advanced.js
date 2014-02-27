var dataApi = require('./data-api'),
    wikipedia = require('wikipedia-js'),
    http = require('http'),
    q = require('q');

var getRandomFeaturedArticleNames = function(num) {
  var promises = [];

  for(var i = 0; i < num; i++) {
    (function() {
      var deferred = q.defer();

      http.get("http://toolserver.org/~dapete/random/enwiki-featured.php", function(res) {
        var location = res.headers.location;

        location = location.match(/.+\/(.+?)$/);
        deferred.resolve(location[1]);
        res.socket.end();
      }).on('error', function(e) {
        deferred.reject(e);
      });

      promises.push(deferred.promise);
    })();
  }

  return q.all(promises);
};

var client = dataApi.client("localhost", 8080, "/data-api"),
    myToken,
    myArticle;

client.authenticate('edmund', 'edmund').then(function(response) {
  myToken = response.token;
  console.log("-- Successfully authenticated!");
  return getRandomFeaturedArticleNames(5);
})

.then(function(articleNames) {
  var promises = [];

  for(var i = 0; i < articleNames.length; i++) {
    (function(title) {
      var deferred = q.defer();
      var options = { query: title, format: "html", summaryOnly: false };

      wikipedia.searchArticle(options, function(err, htmlText) {
        var payload = {
          contentData: {
            _type: 'example.data.act.StandardArticleBean',
            body: htmlText,
            resources: [],
            author: 'Wikipedia',
            name: unescape(title).replace(/_/g, " ")
          }
        };

        client.create(myToken, payload, 'act').then(function(response) {
          console.log("-- Created article "+ response.id);
          deferred.resolve();
        }, function(error) {
          deferred.reject(error);
        });
      });

      promises.push(deferred.promise);
    })(articleNames[i]);
  }

  return q.all(promises);
})

.then(function(results) {
  return client.invalidateToken(myToken);
}, function(error) {
  console.log(error);
})

.then(function() {
  console.log("-- Deleted token!");
})

.then(undefined, function(error) {
  console.error('ERROR: '+ error);
});
