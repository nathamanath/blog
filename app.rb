require 'helpers'
require 'article'
require 'json'

class Blog < Sinatra::Base

  include Helpers

  set :app_file, __FILE__
  set :articles_dir, "#{root}/articles"
  set :title, 'Nathans blog'
  set :cache, production?

  # Page per article
  Article.init("#{settings.articles_dir}/*.md").each do |article|
    get article.path do

      # let me see unpublished in development!!
      halt(404) unless article.published? || settings.development?

      etag article.sha1
      last_modified article.updated_at

      @title = article.title

      article.to_json
    end
  end

  get '/' do
    articles = Article.all

    last_article = Article.last_modified

    etag Digest::SHA1.hexdigest "home_#{last_article.sha1}"
    last_modified last_article.updated_at

    previews = articles.map do |article|

      {
        title: article.title,
        created_at: article.created_at,
        preview: article.preview
      }
    end

    previews.to_json
  end
end

