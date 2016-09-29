$LOAD_PATH << 'lib'

require 'slim'
require 'sinatra/base'
require 'rack/cache'
require 'dalli'

require 'pry' if %W(development test).include? ENV['RACK_ENV']

require File.expand_path('../../app', __FILE__)
