require 'sinatra/base'
require 'json'
require 'time'
require 'digest/sha2'

class AppUpdater < Sinatra::Base
  def self.parse_git
    sha1, date = `git log HEAD~1..HEAD --pretty=format:%h^%ci`.strip.split('^')
    set :commit_hash, sha1
    set :commit_date, Time.parse(date)
  end

  set(:token) { ENV['TRAVIS_TOKEN'] }
  set(:autopull) { production? }

  parse_git

  before do
    cache_control :public, :must_revalidate, expires: 60*30
    etag settings.commit_hash
    last_modified settings.commit_date
  end

  post '/update' do
    halt(401) unless valid_request?

    settings.parse_git

    if settings.autopull?
      out = { response: `git pull 2>&1` }.to_json
    else
      out = { response: :ok }.to_json
    end

    # Clear articles before reloading. Avoids dupes.
    Article.clear!

    app.settings.reset!
    load app.settings.app_file

    content_type :json

    out
  end

  private

  def valid_request?
    digest = Digest::SHA2.new.update "#{repo_slug}#{settings.token}"
    digest.to_s == authorization
  end

  def authorization
    env['HTTP_AUTHORIZATION']
  end

  def repo_slug
    env['HTTP_TRAVIS_REPO_SLUG']
  end
end

