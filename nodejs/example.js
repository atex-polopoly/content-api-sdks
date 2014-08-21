var dataApi = require('./data-api'),
    http = require('http'),
    q = require('q');

var client = dataApi.client("localhost", 8080, "/onecms");
var myToken;

console.log("-- Authenticating...");
client.authenticate('edmund', 'edmund').then(function(response) {
  myToken = response.responseData.token;
  console.log("-- Successfully authenticated!");
})

.then(function() {
  console.log("-- Reading content 1.116...");
  return client.read(myToken, "1.116");
})

.then(function(response) {
  console.log('-- Successfully read content! '+ response.responseData.id +'.'+ response.responseData.version);

  response.responseData.contentData.title = 'An updated article '+ new Date().getTime();

  // this cannot be included when creating/updating content
  delete response.responseData.meta

  console.log("-- Updating content...");
  return q.all([q.when(response.responseData), client.update(myToken, response.responseData, response.etag)]);
})

.spread(function(content, response) {
  console.log('-- Successfully updated content! '+ response.responseData.id +'.'+ response.responseData.version);

  content.contentData.title = 'A created article '+ new Date().getTime();

  console.log("-- Creating content...");
  return client.create(myToken, content);
})

.then(function(response) {
  console.log('-- Successfully created content! '+ response.responseData.id +'.'+ response.responseData.version);

  console.log('-- Searching for content...');
  return client.search(myToken, 'public', 'text:science');
})

.then(function(response) {
  console.log('-- Successfully searched for content! Got '+ response.responseData.response.numFound +' hits.');
})

.then(null, function(error) {
  console.error('ERROR: '+ error);
});
