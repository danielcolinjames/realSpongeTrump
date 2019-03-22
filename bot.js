var spongemock = require('spongemock');
var Twitter = require('twitter');

var client = new Twitter({
    consumer_key: process.env.BOT_CONSUMER_KEY,
    consumer_secret: process.env.BOT_CONSUMER_SECRET,
    access_token_key: process.env.BOT_ACCESS_TOKEN,
    access_token_secret: process.env.BOT_ACCESS_TOKEN_SECRET
});

var trumpParams = {
    screen_name: 'realDonaldTrump',
    // exclude retweets
    include_rts: false,
    count: 5,
    // without this, it'll truncate tweets > 140 characters
    // if this isn't active, 'full_text' needs to be 'text'
    tweet_mode: 'extended'
};

var spongeParams = {
    screen_name: 'realSpongeTrump',
    include_rts: false,
    count: 5,
    tweet_mode: 'extended'
};

var latestTrumpTweetCleaned = '';
var latestTrumpTweetInMockingFormat = '';
var latestTrumpTweetSourceLink = '';

// request @realDonaldTrump's latest tweets
client.get('statuses/user_timeline', trumpParams, function (error, trumpTweets, response) {
    if (!error) {
        // request @realSpongeTrump's latest tweets
        client.get('statuses/user_timeline', spongeParams, function (error, spongeTweets, response) {
            if (!error) {
                //loop through latest [trumpParams.count] tweets from @realDonaldTrump
                for (i = 0; i < trumpTweets.length; i++) {
                    // flag to say if @realSpongeTrump has already mocked the latest Tweet
                    var alreadyMocked = false;
                    // the ID number of the @realDonaldTrump tweet to check
                    lastTrumpTweetIdToCheck = trumpTweets[i].id_str;
                    // loop through the latest few @realSpongeTrump tweets to check them against the latest few @realDonaldTrump tweets
                    for (j = 0; j < spongeTweets.length; j++) {
                        // if the latest tweet by @realSpongeTrump is a quote tweet of @realDonaldTrump's latest tweet, set flag to true
                        try {
                            if (spongeTweets[j].quoted_status.id_str === lastTrumpTweetIdToCheck) {
                                // set this tweet to be skipped
                                alreadyMocked = true;
                            }
                        }
                        catch (err) {
                            // console.log(err)
                        }
                    }
                    // skip anything that has already been mocked
                    if (!alreadyMocked) {
                        // remove URLs from tweet and make ampersands show up properly
                        latestTrumpTweetCleaned = trumpTweets[i].full_text
                            // get rid of links in tweet text
                            .replace(/(?:https?|ftp):\/\/[\n\S]+/g, '')
                            // get rid of escaped ampersands
                            .replace(/&amp;/gi, '&');
                        // use spongemock library to convert the text into Spongebob mocking format
                        latestTrumpTweetInMockingFormat = spongemock.spongeMock(latestTrumpTweetCleaned);
                        // create a link to append to the new tweet so that it's a quote-tweet
                        // ("retweet with comment" actually means: create a new tweet and append a link to the "retweeted" one)
                        latestTrumpTweetSourceLink = 'https://twitter.com/' + trumpTweets[i].user.screen_name + '/status/' + trumpTweets[i].id_str;
                        // parameters to include when sending the new tweet
                        var sendTweetParams = {
                            // attaching this as a URL separate from the text means it won't count against the character limit
                            attachment_url: latestTrumpTweetSourceLink,
                            // this is the tweet converted into mocking format
                            status: latestTrumpTweetInMockingFormat
                        }
                        // send the new tweet
                        client.post('statuses/update', sendTweetParams, function (error, tweet, response) {
                            if (error) throw error;
                        })
                    }
                }
            }
        });
    }
});