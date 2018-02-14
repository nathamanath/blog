# Blog backend

Blog app originally based on demo project in 'Sinatra up and running' book.
It is now a REST api serving content my blog client app.

I have also added:

* test coverage
* next / prev article links
* code syntax highlighting
* caching with memcache
* sprockets intergration for article assets
* Docker setup
* published state on articles
* articles published by created_at date

You can see it running here: [blog.nathansplace.co.uk](http://blog.nathansplace.co.uk)

## TODO:

* paginate articles
* related articles
* tags
* article names unique per year
