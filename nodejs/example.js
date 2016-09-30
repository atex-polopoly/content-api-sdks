// To run this example make sure there is a an ace content-api
// with core-starter-kit running somewhere, and in this directory go:
//
// $ npm install
// $ node example.js --url http://localhost:8080/ace
//
'use strict';

var cms = require ('./content-api.js'),
    args = require ('minimist')(process.argv.slice(2)),
    prompt = require ('prompt'),
    tmpContent;

prompt.ask = function () {
  // console.log('[debug] pget');
  var arg = arguments[0];
  return new Promise (function (resolve, reject) {
    prompt.get.call (this, arg, function (err, result) {
      if (err) {
        reject (err);
        return;
      }
      resolve (result);
    });
  });
};

cms.conf ('example', {
  'url': args.url || 'http://localhost:8080/ace'
});

console.log ();
console.log ('[info] This example currently only works with an endpoint running ace with core-starter-kit.');
console.log ();

prompt.message = '[cms]';
prompt.delimiter = ' ';
prompt.start ();

prompt.ask ({
      properties: {
        'username': {
          description: 'username:'
        },
        'password': {
          hidden: true,
          description: 'password:'
        }
      }
    })
    .then (function (auth) {
      console.log ();
      console.log ('[info] Authenticating ' + auth.username + ' ...');
      console.log ();

      // ** 'Log in' *******************************
      return cms.auth (auth.username, auth.password);
    })
    .then (function (token) {
      console.log ('[info] ... Authentication success!');
      console.log ('[info] token: ' + token);
      console.log ('[info] Now lets create a content ...');
      console.log ();

      var content = {
        'aspects': {
          'contentData': {
            'data': {
              '_type': 'article'
            }
          }
        }
      };

      // ** Create content *******
      return cms.create (content);

    })
    .then (function (created_content) {
      console.log ('[info] ... Yes! We have created a content!');
      console.log ('[info] Created content:', created_content.id);
      console.log ('[info] Now we are going to read the new content ...')
      console.log ();

      // ** Get a content *****************
      return cms.read (created_content.id);

    })
    .then (function (read_content) {
      console.log ('[info] ... and the content was read!');
      console.log ('[info] Next thing is to update the content ...');
      console.log ();

      read_content.aspects.contentData.data.title = 'This article is great news!';

      // ** Modify content ************
      return cms.update (read_content);

    })
    .then (function (updated_content) {
      console.log ('[info] ... yay! Updated content with a title.');
      console.log ('[info] title: ', updated_content.aspects.contentData.data.title);

      // store the content for deletion later
      tmpContent = updated_content;

      console.log ('[info] Let´s try to do a search ...');
      console.log ();

      // ** Search solr core onecms *************
      return cms.search ('onecms', { 'q': '*:*' });

    })
    .then (function (search_result) {
      console.log ('[info] ... Great, got ' + search_result.response.numFound + ' hits!');
      console.log ('[info] (However our newly created content has probable not yet been indexed.)');
      console.log ('[info] But nevertheless, we now try to delete it ...');
      console.log ();

      // ** Delete content **********
      return cms.delete (tmpContent);

    })
    .then (function () {
      console.log ('[info] ... Content deleted.');
      console.log ('[info] Logging out, and thank you goodbye!')

      // This seems to be a no-op when on ace.
      return cms.auth.invalidate ();
    })
    .catch (function (err) {
      console.log ('[error] ', err);
    });
