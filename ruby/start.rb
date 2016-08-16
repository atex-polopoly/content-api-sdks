#!/usr/bin/ruby
require_relative 'content-api'
require 'irb'

@api = ContentApi.new
@api.user('admin','123456').auth


ARGV.clear
IRB.start
