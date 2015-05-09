require 'sinatra/base'
require 'json'
require 'time'

class AppUpdater < Sinatra::Base
  def self.parse_git
    sha1, date = `git log HEAD~1..HEAD --pretty=format:%h^%ci`.strip.split('^')
    set :commit_hash, sha1
    set :commit_date, Time.parse(date)
  end

  set(:autopull) { production? }
  parse_git

  before do
    cache_control :public, :must_revalidate, expires: 60*30
    etag settings.commit_hash
    last_modified settings.commit_date
  end

  post '/update' do
    halt(401) unless ENV['SECRET'] == params['config']['secret']

    settings.parse_git

    if settings.autopull?
      out = { response: `git pull 2>&1` }.to_json
    else
      out = { response: :ok }.to_json
    end

    app.settings.reset!
    load app.settings.app_file

    content_type :json

    out
  end
end

