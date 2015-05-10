require 'helpers'
require 'app_updater'
require 'article'

class Blog < Sinatra::Base
  include Helpers

  use AppUpdater

  set :app_file, __FILE__
  set :articles_dir, "#{root}/articles"
  set :title, 'Nathans blog'
  set :cache, production?

  Article.clear!

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
    slim :index
  end
end

