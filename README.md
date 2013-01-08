# Node nano-blog

*An extremely small static blog generator for node*

This generator takes a folder of markdown files and turns it into a static blog. It creates the individual blog posts, list pages of posts (index and archive) and a rss feed. It's pretty restrictive but it renders my sites exactly how I want them to render.

Example sites: I'm currently using it on [my blog](http://mvr.me) and my [photoblog](http://mijnrealiteit.nl).

1. How to install:

        $ git clone git://github.com/askmike/nano-blog.git 
        $ cd nano-blog
        $ npm install
  
2. How to configure

 * Edit `config.json` to your needs.
 * Change views/about.md to whatever you want.
 * Change the way the website looks by editing the views and the assets, found in output/assets (don't forget to change to GA tag in the script.js).

3. How to build

        $ node app

## Important

nano-blog is an extremely small project, when using it keep the following in mind:

* The name of the markdown file will be the post url.
* Nano-blog just prints the post in the index / archive. This means that if you don't link to the individual post nobody will (atleast nano-blog doesn't).
* Nano-blog uses some meta information for each post, page. Take a look at posts/example.md. If you add a new post you can skip this and nano-blog will add it for you (the post date will be the build time).
* The first H1 in your post will be used as the title, nano-blog doesn't care if posts don't have a title.
* You can have pages: they don't show up in index / archives and the rss feed. They also don't have the `posted on x` information.

## Todo

* Minify and copy over the assets, change the filename if the've changed due to caching.