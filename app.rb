require 'helpers'
require 'article'
require 'sinatra/asset_pipeline'

class Blog < Sinatra::Base
  include Helpers

  set :assets_js_compressor, :uglifier
  set :assets_css_compressor, :sass

  set :app_file, __FILE__
  set :articles_dir, "#{root}/articles"
  set :title, 'Nathans blog'
  set :cache, production?

  register Sinatra::AssetPipeline

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
      @articles = Article.all.select { |article| article.year == year }
      slim :index
    end
  end

  get '/' do
    @articles = Article.all

    last_article = @articles.first

    etag last_article.sha1
    last_modified last_article.updated_at

    slim :index
  end
end

