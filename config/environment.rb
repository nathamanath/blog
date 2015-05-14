$LOAD_PATH << 'lib'

require 'slim'
require 'sinatra/base'
require 'rack/cache'
require 'dalli'

require 'dotenv'
Dotenv.load

require File.expand_path('../../app', __FILE__)

