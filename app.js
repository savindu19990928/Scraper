const express = require('express');
const app = express();
const path = require('path');
const mongoose = require('mongoose');
const axios = require('axios');
const FB = require('fb');
const passport = require('passport');
const FacebookTokenStrategy = require('passport-facebook-token');

const urI = 'mongodb+srv://devrious:Uzumaki%4045@templates.knku2v7.mongodb.net/scraper?retryWrites=true&w=majority';

let access_token = '';

function extractHashtags(text) {
    if (!text) {
        return [];
    }

    // Regular expression to match hashtags
    const regex = /#[^\s#]*/g;

    // Extract hashtags from text
    const hashtags = text.match(regex);

    // Return the extracted hashtags
    return hashtags || [];
}

passport.use(new FacebookTokenStrategy({
    clientID: '386902587587711',
    clientSecret: '788806c96499430460f016dec290d3a9'
}, function (accessToken, refreshToken, profile, done) {
    done(null, profile);
}));

const uploadVideo = (accessToken, videoData, description) => {
    FB.setAccessToken('EAAFf4sdLvH8BO4BHfRhlTIDmTllnTZClYhe9fbbE1GIE0pGxU9nDE0GHmnF7wL68zROLOiXARCEIaAVKTgW8ZA0HeYW0v6uDbtZBfDPCuucdLZA68voGKMMCtCmexmqxDA1SIlsZAXyAaQWERQbsIgZBegEXaL9M5JEmVZCWEO5i9IOvPYXbK2UvrwXGtdLLLtpWm5VJnYM');

    const formData = {
        file_url: videoData,
        description: description
    };

    FB.api(
        '/me/videos',
        'POST',
        formData,
        function (res) {
            if (!res || res.error) {
                console.log(!res ? 'error occurred' : res.error);
                return;
            }
        }
    );
    console.log('done');
};

mongoose.connect(urI);

const linkSchema = new mongoose.Schema({
    link: {
        type: String,
        required: true
    },
    caption: [{
        type: String
    }]
});

const Link = mongoose.model('link', linkSchema);

app.set('view engine', 'ejs');
app.set('views', 'views');
app.use(express.static(path.join(__dirname, 'assets')));
app.use(express.urlencoded({
    extended: false
}));
app.use(express.json({
    limit: '5mb'
}));

app.post('/add', async function (req, res) {
    const usernamesS = req.body.usernames || "";
    if (req.body.pass != "dev@tik@scraper@45") {
        return res.send('Wrong Password!');
    }
    const users = usernamesS.split(" ");

    res.send('SUCCESS');
    res.end();
    
    let f1delay = 3000;

    users.forEach((user) => {
        setTimeout(() => {
            async function f1() {
                const options = {
                    method: 'GET',
                    url: 'https://tiktok-scraper7.p.rapidapi.com/user/posts',
                    params: {
                        unique_id: user,
                        count: '1000'
                    },
                    headers: {
                        'X-RapidAPI-Key': 'f34902baffmsh4d26ee5486241d5p188ddfjsnf62ba6a713ab',
                        'X-RapidAPI-Host': 'tiktok-scraper7.p.rapidapi.com'
                    }
                };

                try {
                    const response = await axios.request(options);
                    let f2delay = 20000;
                    response.data.data.videos.forEach(video => {
                        setTimeout(() => {
                            async function f2() {
                                Link.findOne({ link: video.video_id }).then(async result => {
                                    if (result) {
                                        return;
                                    } else {
                                        const url = 'https://www.tiktok.com/@' + user + '/video/' + video.video_id;
                                        const options1 = {
                                            method: 'GET',
                                            url: 'https://tiktok-full-info-without-watermark.p.rapidapi.com/vid/index',
                                            params: {
                                                url: url
                                            },
                                            headers: {
                                                'X-RapidAPI-Key': 'f34902baffmsh4d26ee5486241d5p188ddfjsnf62ba6a713ab',
                                                'X-RapidAPI-Host': 'tiktok-full-info-without-watermark.p.rapidapi.com'
                                            }
                                        };

                                        try {
                                            const response = await axios.request(options1);
                                            const hashtagsList = await extractHashtags(video.title);
                                            const livkID = new Link({
                                                link: video.video_id,
                                                caption: hashtagsList
                                            });
                                            await livkID.save();
                                            const hashtags = hashtagsList.join(' ');
                                            uploadVideo(access_token, response.data.video[0], hashtags);
                                        } catch (error) {
                                            console.error(error);
                                        }
                                    }
                                });
                            }
                            f2();
                        }, f2delay);
                        f2delay += 20000;
                    });
                } catch (error) {
                    console.error(error);
                }
            }
            f1();
        }, f1delay);
        f1delay += 3000;
    });
});

app.get('/', function (req, res) {
    res.render('usernames');
});

app.listen(process.env.PORT || 3000);
//devanjeesuhanya thiyasha_p
//dev@tik@scraper@45