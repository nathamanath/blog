module Helpers
  def link_to_unless_current(text, location)
    if request.path_info == location
      text
    else
      "<a href=\"#{location}\">#{text}</a>"
    end
  end

  def page_title
    (@title) ? "#{@title} | #{base_title}" : base_title
  end

private
  def base_title
    settings.title
  end
end

