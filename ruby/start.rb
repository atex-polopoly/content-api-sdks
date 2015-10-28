#!/usr/bin/ruby
require_relative 'content-api'
require 'irb'

@api = ContentApi.new
@api.user('sysadmin','sysadmin').auth


ARGV.clear
IRB.start
