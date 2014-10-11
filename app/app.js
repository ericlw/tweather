var Twitter = require('twit');
var request = require('request');
var config = require('./config');

var twitter = new Twitter(config);

// Stream of @mentions for @tweather_app
var stream = twitter.stream('statuses/filter', { track: '@tweather_app' });

// Attempting connection to streaming API
stream.on('connect', function (response) {
    console.log("Opening Twitter streaming connection.")
});

// Connection opened
stream.on("connected", function (response) {
    console.log("Streaming...")
});

// The @mentions
stream.on('tweet', function (tweet) {
    handleTweet(tweet);
});

function handleTweet(tweet) {
    var zip = extractCityOrZip(tweet.text);
    if (zip) {
        console.log(zip[0])
    } else {
        var geo = tweet.coordinates;
        if (geo && geo.type == 'Point') {
            var lat = geo.coordinates[1];
            var lon = geo.coordinates[0];
            request("http://api.openweathermap.org/data/2.5/forecast/daily?lat=" + lat + "&lon=" + lon + "&cnt=1&mode=json&units=imperial",
                function (err, response, body) {
                    if (err) {
                        return console.log("Error getting weather for lat=" + lat + " & lon=" + lon, err);
                    }
                    var weather = JSON.parse(body);

                    var status = "@" + tweet.user.screen_name + " the forecast for " + weather.city.name +
                        " today is " + weather.list[0].weather[0].main.toLowerCase() +
                        " with a high of " + weather.list[0].temp.max + " and a low of " + weather.list[0].temp.min;

                    twitter.post('statuses/update', { status: status, in_reply_to_status_id: tweet.id }, function (err, data, response) {
                        if (err) {
                            console.log(err);
                        } else {
                            console.log(data);
                        }
                    });
                });
        }
    }
}

function extractCityOrZip(str) {
    //the regular expression below is for 5 digit US ZIP code, 5 digit US ZIP code + 4,
    //and 6 digit alphanumeric Canadian Postal Code
    var re = /\d{5}-\d{4}|\d{5}|[A-Z]\d[A-Z] \d[A-Z]\d/

    return re.exec(str);
}
