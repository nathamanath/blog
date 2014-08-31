require_relative './config/environment'

use Rack::Cache,
  metastore: 'memcached://localhost:11211/meta',
  entitystore: 'memcached://localhost:11211/body',
  verbose: true
run Blog

