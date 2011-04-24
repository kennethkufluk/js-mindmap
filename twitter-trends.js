/*
  Trends
  Kenneth Kufluk 2011

  I take tweets and break them down into words.
  I index the tweets by word and maintain a count of popular words.
  The aim is to show micro-trends.

  Listens:
  - Roar.tweet
  - common-words

  Fires:
  - Roar.newWordset
*/
$(function() {
  var $tweetDiv =$('#activity');

  var trend_words = {};
  var hashtags = {};

  var RE_break_into_words = /\b(\w{4,})\b/g;
  var silent_words = ['http', 'bit', 'com'];

  // Get:  common-words
  $.get('roar/common-words.txt', function(data) {
    // silent_words = silent_words.concat(data.replace(/[\n ]/g, '').split(/,/));
  });

  // log the hashtags
  $(window).bind('Roar.addHashtags', function(e, data) {
    $.extend(hashtags, data);
  });

  // Listen:  tweet
  $(window).bind('Roar.tweet', function(e, tweet) {
    // console.log('trends: indexing tweet');
    if (!tweet.text) return;
  	var matches = tweet.text.match(RE_break_into_words);
  	var word, hashes = {};
    // check tweet for hashtags
    for (tag in hashtags) {
      if (!hashtags.hasOwnProperty(tag)) continue;
      if (matches.indexOf(tag)>=0) {
        if (!hashes[tag]) hashes[tag]=0;
        hashes[tag]++;
      }
      if (hashtags[tag].alternate) {
        for (var subtag in hashtags[tag].alternate) {
          if (matches.indexOf(hashtags[tag].alternate[subtag])) {
            if (!hashes[tag]) hashes[tag]=0;
            hashes[tag]++;
          }
        }
      }
    }
    // add the words to the trends
  	for (var i=0, l=matches.length; i<l ;i++) {
  		word = matches[i].toLowerCase();
  		// increment each word
  		if (trend_words[word]) {
  		  trend_words[word].count++;
  		} else {
  		  trend_words[word] = {
    		  count:1,
    		  hashtags: hashtags,
    		  hash:{}
    		};
  		}
  		// increment the hashes
  		for (var hash in hashes) {
        if (!hashes.hasOwnProperty(hash)) continue;
  		  if (trend_words[word].hash[hash]) {
  		    trend_words[word].hash[hash] += hashes[hash];
  		  } else {
  		    trend_words[word].hash[hash] = hashes[hash];
  		  }
  		}
  	}
  });

  var tidyup_words = setInterval(function() {
    var word;
  	for (word in trend_words) {
  		if (trend_words.hasOwnProperty(word)) {
  		  trend_words[word].count--;
        // TODO: perf test this
  		  if (trend_words[word].count<=0) delete trend_words[word];
  		}
  	}
  }, 3000);

  // update the blobs
  var ballTimer = setInterval(function() {
    var word;
    for (word in silent_words) {
      if (!silent_words.hasOwnProperty(word)) continue;
      delete trend_words[silent_words[word]];
    }
    $(window).trigger('Roar.newWordset', [trend_words]);
  }, 1000);

});
