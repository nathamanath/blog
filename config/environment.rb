$LOAD_PATH << 'lib'

require 'slim'
require 'sinatra/base'
require 'rack/cache'
require 'dalli'

require File.expand_path('../../app', __FILE__)

