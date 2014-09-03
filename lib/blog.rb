require 'app_updater'
require 'article'
require 'helpers'

class Blog < Sinatra::Base
  include Helpers

  use AppUpdater

  root = File.expand_path('../../', __FILE__)
  article_dir = (test?) ? "#{root}/spec/fixtures/articles" : "#{root}/articles"

  set :root, root
  set :articles, []
  set :app_file, __FILE__
  set :article_files, Dir["#{article_dir}/*.md"]
  set :title, 'Nathans blog'

  # require 'logger'
  #
  # enable :logging
  #
  # before do
  #   log_file = "#{settings.root}/log/#{settings.environment}.log"
  #   logger ||= Logger.new(log_file, 10, 102400)
  #   logger.level = Logger::INFO
  # end

  def self.article_pages
    article_files.each do |f|
      article = Article.new_from_file(f)

      get "/#{article.slug}" do
        etag article.sha1
        last_modified article.updated_at

        @title = article.title

        slim :article, locals: { article: article }
      end

      articles << article
    end
  end

  self.article_pages

  Article.sort!(articles)

  get '/' do
    slim :index
  end
end

