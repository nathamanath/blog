require 'app_updater'
require 'article'
require 'helpers'
require 'logger'

class Blog < Sinatra::Base
  include Helpers

  use AppUpdater

  # TODO: extract to sinatra extension
  root = File.expand_path('../../', __FILE__)
  articles_dir = root
  articles_dir += (test?) ? "/spec/fixtures/articles" : "/articles"

  set :root, root
  set :articles, []
  set :app_file, __FILE__
  set :article_files, Dir["#{articles_dir}/*.md"]
  set :title, 'Nathans blog'

  enable :cache

  log_file = File.new("#{settings.root}/log/#{settings.environment}.log", "a+")
  log_file.sync = true

  Logger.class_eval { alias :write :'<<' }
  logger = Logger.new(log_file, 10, 1024000)
  logger.level = Logger::DEBUG

  before { env["rack.errors"] = log_file }

  configure :development, :test do
    disable :cache
    logger.level = Logger::DEBUG
  end

  configure :production, :staging do
    logger.level = Logger::WARN
  end

  configure do
    use Rack::CommonLogger, logger
  end

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
    slm :index
  end
end

