/*

    nano-blog

  An extremely small static blog generator for node

  It does:

  1.  remove old output
  2.  get jade templates
  3.  get markdown content
  4.  output website:
    * index pages, containing x items per page, set x in config.json
    * RSS page containing the x most recent items
    * individual pages

*/
var start = +new Date(),
  io = 0;
var fs = require('fs');

// helpers
var utils = (function() {

  // decorator to time the function
  // (only works on sync functions)
  var stopwatch = function(fn) {
    return function() {
      var now = +new Date();
      var args = Array.prototype.slice.call(arguments);
      var result = fn.apply(this, args);
      io += new Date() - now;
      return result;
    }
  };

  return {
    // all IO operations under stopwatch
    read: stopwatch(fs.readFileSync),
    readDir: stopwatch(fs.readdirSync),
    write: stopwatch(fs.writeFileSync),
    del: stopwatch(fs.unlinkSync),
    
    _months: [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ],
    getMonth: function(date) {
      return utils._months[date.getMonth()];
    },
    // load a jade template
    load: function(template) {
      return utils.read(config.views + template + '.jade');
    },
    // stich jade templates together
    stitch: function() {
      var args = Array.prototype.slice.call(arguments);
      return args.join('\n');
    },
    writeOutput: function(template, input, url) {
      if(!url) 
        url = input.url;
      l('WRITING ' + config.output + url + '.html');
      var content = template( utils.prepareInput( input ) ).replace(/(\r\n|\n|\r)/gm, ' ');
      utils.write(config.output + url + '.html', content);
    },
    prepareInput: function(obj) {
      return _.extend(obj, {
        root: config.root,
        assets: config.root + 'assets/',
        name: config.name,
        about: about,
        extension: config.extension,
        page: obj.page
      });
    }
  };

})();

var config = JSON.parse( utils.read('config.json', 'utf8') );

// logger
var l = function(m) {
  config.debug && console.log('DEBUG: ' + m);
}

var _ = require('underscore'),
  jade = require('jade'),
  marked = require('marked');
  // toMarkdown = require('to-markdown').toMarkdown;

// 1.  remove old output
// delete all previous `.html` files
(function() {
  var files = utils.readDir('output/');
  files = _.filter(files, function(n) { return n.indexOf('.html') !== -1 });
  if(files.length) {
    l('cleaing up, deleting ' + files.length + ' old output files');
    _.each(files, function(file) {
      utils.del(config.output + file);
    });
  }
})();

// 2.  get jade templates
l('loading templates');
var postTemplate, listTemplate, pageTemplate, about;
(function() {
  var header = utils.load('header'),
    footer = utils.load('footer'),
    list = utils.stitch(header, utils.load('list'), footer),
    post = utils.stitch(header, utils.load('post'), footer),
    page = utils.stitch(header, utils.load('page'), footer);

  postTemplate = jade.compile(post);
  listTemplate = jade.compile(list);
  pageTemplate = jade.compile(page);
  about = marked( utils.read(config.views + 'about.md', 'utf8') );
})();

// 3.  get markdown content
(function() {
  var postNames = utils.readDir(config.input), posts = [], post;
  // filter out all non markdown files
  postNames = _.filter(postNames, function(n) { return n.indexOf('.md') !== -1 });
  _.each(postNames, function(name) {
    post = utils.read( config.input + name, 'utf8' ).split('\n-NANO-');
    if(post.length === 1) {  // new post
      l('adding new post: ' + name);
      post = JSON.stringify({date: new Date() / 1000}) + '\n-NANO-\n\n' + post;
      utils.write(config.input + name, post);
      post = post.split('\n-NANO-');
    }
    post[0] = JSON.parse( post[0] );
    post = _.extend( post[0], {content: post[1], url: name} );
    posts.push(post);
  });

  // convert content for every post
  for(var i = 0, len = posts.length ; i < len; i++) {
    // remove the `.md`
    posts[i].url = posts[i].url.slice(0, -3);

    // add date based on timestamp
    var date = new Date(posts[i].date * 1000);
    posts[i].month = utils.getMonth(date);
    posts[i].day = date.getDate();
    posts[i].year = date.getFullYear();

    posts[i].content = marked(posts[i].content);
  }

  posts = _.sortBy(posts, function(p) { return -p.date });
  var blogPosts = _.filter(posts, function(p) { return !p.page });

  var curr = -1, items = [];
  _.each(blogPosts, function(item, index) {
    if(index % config.itemsPerPage === 0) {
      // create a new array per page
      items[ ++curr ] = [];
    }

    items[ curr ].push(item);
  });

  // 4.  output website:
  //    * index pages, containing x items per page, set x in config.json
  var createRSSfeed = function(page) {
    var rss = require('rss');
    var site = 'http://' + config.domain + config.root;
    var feed = new rss({
      title: config.name,
      description: about,
      feed_url: site + '/feed' + config.extension,
      site_url: site,
      image_url: 'http://' + config.domain + config.assets + 'logo.png',
      author: config.author
    });
    _.each(page, function(post) {
      var item = {
        description: post.content,
        url: site + post.url,
        date: post.date * 1000,
        title: ''
      };
      var title = post.content.match(/<h1>[\S\s]*?<\/h1>/gi);
      if(!title) // we only want posts with title in the rss
        return;
      item.title = title[0].replace(/<[^>]+>/g, "");;
      feed.item(item);
    });
    l('WRITING ' + config.output + 'feed.rss');
    utils.write(config.output + 'feed.rss', feed.xml());
  };

  _.each(items, function(page, index) {
    var url;
    if(index === 0) {
      url = 'index';
      createRSSfeed(page);
    } else
      url = 'page-' + (index + 1);

    var list = {
      url: url,
      items: page
    }

    // nav
    if(index > 0 && index !== 1)
      list.next = 'page-' + index + config.extension;

    // if we're on the second page, link to root
    if(index === 1)
      list.next = './';

    // -1 is the last item, so -2 is the second last
    if(index < items.length - 2)
      list.previous = 'page-' + (index + 2) + config.extension;

    utils.writeOutput(listTemplate, list);
  });
  
  // 4.  output website:
  //    * individual pages
  _.each(posts, function(post) {
    if(post.page)
      utils.writeOutput(pageTemplate, post);
    else
      utils.writeOutput(postTemplate, post);
  });

  l('All done. It took ' + (new Date() - start)/1000 + ' seconds, of which IO took ' + io/1000 + ' seconds.');
})();

