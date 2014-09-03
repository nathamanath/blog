$LOAD_PATH << 'lib'

# External
require 'slim'
require 'sinatra/base'
require 'rack/cache'
require 'dalli'
require 'logger'

# Internal
require 'blog'

