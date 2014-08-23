require_relative './config/environment'

require 'blog'

use Rack::Cache
run Blog

