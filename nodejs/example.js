var dataApi = require('./data-api'),
    http = require('http'),
    q = require('q');

var client = dataApi.client("localhost", 8080, "/data-api"),
    myToken,
    myArticle;

console.log("-- Authenticating...");
client.authenticate('edmund', 'edmund').then(function(response) {
  myToken = response.token;
  console.log("-- Successfully authenticated!");
})

.then(function() {
  console.log("-- Reading content 1.229...");
  return client.read(myToken, "1.229", "act");
})

.then(function(response) {
  console.log('-- Successfully read content! '+ response.id +'.'+ response.version);

  response.contentData.name = 'An updated article '+ new Date().getTime();

  console.log("-- Updating content...");
  return q.all([q.when(response), client.update(myToken, response, 'act')]);
})

.spread(function(content, response) {
  console.log('-- Successfully updated content! '+ response.id +'.'+ response.version);

  content.contentData.name = 'A created article '+ new Date().getTime();

  console.log("-- Creating content...");
  return client.create(myToken, content, 'act');
})

.then(function(response) {
  console.log('-- Successfully created content! '+ response.id +'.'+ response.version);

  console.log('-- Searching for content...');
  return client.search(myToken, 'public', 'text:An updated article', 'act');
})

.then(function(response) {
  console.log('-- Successfully searched for content! Got '+ response.response.numFound +' hits.');
})

.then(null, function(error) {
  console.error('ERROR: '+ error);
});
