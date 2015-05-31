FactoryGirl.define do
  factory :article do
    created_at Time.now
    updated_at Time.now
    title 'title'
    content 'content'
    slug 'title'
    tldr 'lol'

    sequence(:sha1) {|n| "hash_#{n}" }
  end
end

