require 'redcarpet'
require 'coderay'

module Helpers
  def link_to_unless_current(text, location)
    if request.path_info == location
      "<span>#{text}</span>"
    else
      "<a href=\"#{location}\">#{text}</a>"
    end
  end

  def page_title
    (@title) ? "#{@title} | #{base_title}" : base_title
  end

  class CodeRayify < Redcarpet::Render::HTML
    def block_code(code, language)
      CodeRay.scan(code, language).div(
        # line_numbers: :inline,
        css: :class,
        line_number_anchors: false
      )
    end
  end

  def markdown(text)
    coderayified = CodeRayify.new(
      filter_html: true,
      hard_wrap: true
    )

    options = {
      tables: true,
      fenced_code_blocks: true,
      no_intra_emphasis: true,
      autolink: true,
      strikethrough: true,
      lax_html_blocks: true,
      superscript: true,
      space_after_headers: true,
      underline: true,
      highlight: true,
      quote: true,
      footnotes: true,
      hard_wrap: false
    }

    markdown_to_html = Redcarpet::Markdown.new(coderayified, options)
    markdown_to_html.render(text)
  end

private
  def base_title
    settings.title
  end
end

