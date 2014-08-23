require 'config/environment'
require 'blog'

use Rack::Cache

run Blog

