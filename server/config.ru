require_relative './config/environment'

cache_options = {
  metastore: 'memcached://localhost:11211/meta',
  entitystore: 'memcached://localhost:11211/body',
  verbose: true
}

use Rack::Cache, cache_options if App.settings.cache?

run App

