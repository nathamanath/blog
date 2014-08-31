require 'spec_helper'
require 'rack/test'

require File.expand_path('../../lib/blog', __FILE__)

module RackSpecHelpers
  include Rack::Test::Methods
  attr_accessor :app
end

RSpec.configure do |c|
  c.include RackSpecHelpers, feature: true

  c.before feature: true do
    # Load in fixture articles

    Blog.settings.reset!
    load Blog.settings.app_file

    Blog.class_eval do
      configure(:test) do
        set :article_files, Dir[File.expand_path './spec/fixtures/articles/*.md']
      end
    end

    Blog.article_pages

    self.app = Blog
  end
end

