$LOAD_PATH << 'lib'

# External
require 'slim'
require 'sinatra/base'
require 'rack/cache'
require 'dalli'

# Internal
require File.expand_path('../../app', __FILE__)

