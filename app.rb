require 'helpers'
require 'article'
require 'sprockets'
require 'sprockets-helpers'

class Blog < Sinatra::Base

  include Helpers


  set :sprockets, Sprockets::Environment.new(root)
  set :assets_prefix, '/assets'
  set :digest_assets, false

  configure do
    # Setup Sprockets
    sprockets.append_path File.join(root, 'assets', 'stylesheets')
    sprockets.append_path File.join(root, 'assets', 'javascripts')
    sprockets.append_path File.join(root, 'assets', 'images')

    sprockets.js_compressor  = :uglify
    sprockets.css_compressor = :scss

    # Configure Sprockets::Helpers (if necessary)
    Sprockets::Helpers.configure do |config|
      config.environment = sprockets
      config.prefix      = assets_prefix
      config.digest      = digest_assets
      config.public_path = public_folder

      # Force to debug mode in development mode
      # Debug mode automatically sets
      # expand = true, digest = false, manifest = false
      config.debug       = true if development?
    end
  end

  set :app_file, __FILE__
  set :articles_dir, "#{root}/articles"
  set :title, 'Nathans blog'
  set :cache, production?

  get "/assets/*" do
    env["PATH_INFO"].sub!("/assets", "")
    settings.sprockets.call(env)
  end

  # Page per article
  Article.init("#{settings.articles_dir}/*.md").each do |article|
    get article.path do

      # let me see unpublished in development!!
      halt(404) unless article.published? || settings.development?

      etag article.sha1
      last_modified article.updated_at

      @title = article.title

      slim :article, locals: { article: article }
    end
  end

  # Page per year
  years = Article.all.map { |article| article.year }

  years.uniq.each do |year|
    get "/#{year}" do
      # articles for year
      @heading = "Articles from #{year}:"
      @articles = Article.for_year year

      last_article = @articles.first

      etag last_article.last.sha1
      last_modified last_article.updated_at

      slim :index
    end
  end

  get '/' do
    @articles = Article.all

    # TODO: Use last updated, not last created
    last_article = Article.last_modified

    etag Digest::SHA1.hexdigest "home_#{last_article.sha1}"
    last_modified last_article.updated_at

    slim :index
  end
end

