require_relative './config/environment'

if ENV['MEMCACHED_HOST']
  cache_options = {
    metastore: "memcached://#{ENV['MEMCACHED_HOST']}:11211/met",
    entitystore: "memcached://#{ENV['MEMCACHED_HOST']}:11211/body"
  }
else
  cache_options = {}
end

use Rack::Cache, cache_options if App.settings.cache?

run App
