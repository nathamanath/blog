require 'sprockets'
require 'sprockets-helpers'

module Helpers
  include Sprockets::Helpers

  def image_url(image)
    "http://#{request.host_with_port}#{image_path(image)}"
  end
end
