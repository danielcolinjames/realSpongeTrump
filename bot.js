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
    // exclude_replies: true,
    include_rts: false,
    count: 5,

    // without this, it'll truncate tweets > 140 characters
    // if this isn't active, 'full_text' needs to be 'text'
    tweet_mode: 'extended'
};

var latestTrumpTweetCleaned = '';
var latestTrumpTweetInMockingFormat = '';
var latestTrumpTweetSourceLink = '';

var spongeParams = {
    screen_name: 'realSpongeTrump',
    // exclude_replies: true,
    include_rts: false,
    count: 1,

    // without this, it'll truncate tweets > 140 characters
    // if this isn't active, 'full_text' needs to be 'text'
    tweet_mode: 'extended'
};

var latestSpongeTweetCleaned = '';

function alreadyMockedLastTweet(lastTrumpTweetIdToCheck) {
    client.get('statuses/user_timeline', spongeParams, function (error, tweets, response) {
        latestSpongeTweetCleaned = tweets[0].full_text
            .replace(/(?:https?|ftp):\/\/[\n\S]+/g, '')
            .replace(/&amp;/gi, '&');

        console.log(tweets[0].quoted_status.id_str + ' <-- last tweet quoted by @realSpongeTrump // last tweet by @realDonaldTrump --> ' + lastTrumpTweetIdToCheck);
        console.log(tweets[0].quoted_status.id_str === lastTrumpTweetIdToCheck);

        // if the latest tweet by @realSpongeTrump is a quote tweet of @realDonaldTrump's latest tweet, return true
        return tweets[0].quoted_status.id_str === lastTrumpTweetIdToCheck;
    });
}

client.get('statuses/user_timeline', trumpParams, function (error, tweets, response) {
    if (!error) {
        //loop through latest [trumpParams.count] tweets
        for (var i = 0; i < tweets.length; i++) {

            // check that we haven't already mocked the latest Tweet
            if (!alreadyMockedLastTweet(tweets[i].id_str)) {

                latestTrumpTweetCleaned = tweets[i].full_text
                    // get rid of links in tweet text
                    .replace(/(?:https?|ftp):\/\/[\n\S]+/g, '')
                    // get rid of escaped ampersands
                    .replace(/&amp;/gi, '&');

                // use spongemock library to convert the text into Spongebob mocking format
                latestTrumpTweetInMockingFormat = spongemock.spongeMock(latestTrumpTweetCleaned);

                // create a link to append to the new tweet so that it's a quote-tweet
                // (when you click Retweet on the Twitter official clients and then add a comment, this is what Twitter is doing on the backend: creating a new tweet with a link to the 'retweeted' one)
                latestTrumpTweetSourceLink = 'https://twitter.com/' + tweets[i].user.screen_name + '/status/' + tweets[i].id_str;

                // parameters to include when sending the new tweet
                var sendTweetParams = {
                    // attaching this as a URL separate from the text means it won't count against the character limit
                    attachment_url: latestTrumpTweetSourceLink,
                    // this is the tweet converted into mocking format
                    status: latestTrumpTweetInMockingFormat
                }

                // send the new tweet
                client.post('statuses/update',
                    sendTweetParams,
                    function (error, tweet, response) {
                        if (error) throw error;
                        // console.log(tweet);  // Tweet body.
                        // console.log(response);  // Raw response object.
                    })
            }
        }
    }
    else {
        console.log(error);
        //   console.log(tweets);
        //   console.log(response);
    }
});