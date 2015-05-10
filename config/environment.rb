$LOAD_PATH << 'lib'

require 'dotenv'
require 'slim'
require 'sinatra/base'
require 'rack/cache'
require 'dalli'

Dotenv.load

require File.expand_path('../../app', __FILE__)

