require 'spec_helper'
require 'rack/test'

require File.expand_path('../../app', __FILE__)
require 'article'

module RackSpecHelpers
  include Rack::Test::Methods
  attr_accessor :app
end

RSpec.configure do |c|
  c.include RackSpecHelpers, feature: true

  c.before feature: true do
    self.app = Blog
  end
end

