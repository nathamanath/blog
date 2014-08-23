$LOAD_PATH << 'lib'

require 'rack/cache'

require 'blog'

use Rack::Cache

run Blog

