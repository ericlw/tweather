#Tweather

Get on demand weather for your current location on Twitter using the Streaming API! 

Tweather watches for geo tagged @mentions of [@Tweather](https://twitter.com/tweather) and replies back with current weather for the location that the mention came from.

It will also parse Tweets with North American style zip codes and look for the current weather in that location.

For example, creating a tweet that says: "@Tweather Tell me the weather for 90210" will get your Twitter user a response from the bot that says "@your_user the forecast for Beverly Hills today is ..."

The app uses the [Open Weather Map API](http://openweathermap.org/api) to get weather information, which requires an API key.

#Requirements
* node

#Getting Started

* Register an application at https://apps.twitter.com

Note: Creating new Twitter applications require that your Twitter profile have a mobile phone number attached to the profile.

Create and obtain consumer keys and access tokens from your newly created Twitter app. These will be used by your config.js file.

* Register for an API Key at http://openweathermap.org/

Create an account and obtain an API key. This will also be used by your config.js file

* Clone this repository.
* On your command line, type `npm install`, which installs the dependencies this project will require.
* On your command line, `mv app/config.sample.js app/config.js`
* input your application credentials in app/config.js including the handle for your app.
* Start the node server by typing `node app/app.js`
* On Twitter.com or a Twitter mobile app, create and send a tweet to @Tweather with a zip code!

Note: The Twitter user that you get a response from will be the account that is authorized with this Twitter application, not @Tweather.
