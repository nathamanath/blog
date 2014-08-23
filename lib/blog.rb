require 'sinatra/base'

require 'app_updater'
require 'article'

class Blog < Sinatra::Base
  use AppUpdater

  set :root, File.expand_path('../../', __FILE__)
  set :articles, []
  set :app_file, __FILE__

  Dir.glob "#{root}/articles/*.md" do |f|
    article = Article.new_from_file(f)

    get "/#{article.slug}" do
      etag article.sha1
      last_modified article.mtime

      erb :post, locals: {article: article}
    end

    articles << article
  end

  articles.sort_by! { |a| a.date }
  articles.reverse!

  get '/' do
    erb :index
  end
end

