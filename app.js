const express = require('express');
const app = express();
const mongoose = require('mongoose');
const multer = require('multer');
const { Buffer } = require('buffer');
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
    clientID: '1164932591431909',
    clientSecret: '5b4d64ec490b5637fca223907de1c8be'
}, function (accessToken, refreshToken, profile, done) {
    done(null, profile);
}));


const uploadVideo = (accessToken, videoData, description) => {
    FB.setAccessToken(accessToken);

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
            console.log('Video ID: ' + res.id);
        }
    );
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

app.get('/add', async function (req, res) {
    res.end();

    const users = ['devanjeesuhanya'];

    users.forEach(async (user) => {
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
            response.data.data.videos.forEach(async video => {
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
                            console.log(response.data.video[0]);
                            uploadVideo(access_token, response.data.video[0], 'testing 1');
                        } catch (error) {
                            console.error(error);
                        }

                        const livkID = new Link({
                            link: video.video_id,
                            caption: extractHashtags(video.title)
                        });
                        await livkID.save();
                    }
                });
            });
        } catch (error) {
            console.error(error);
        }
    });

    return res.end();
});

app.get('/', function (req, res) {
    const url = `https://graph.facebook.com/oauth/access_token?client_id=1164932591431909&client_secret=5b4d64ec490b5637fca223907de1c8be&grant_type=client_credentials`;
    fetch(url)
        .then(res => res.json())
        .then((json) => {
            access_token = json.access_token;
            console.log(access_token);
            res.redirect('/add');
        })
        .catch(err => console.error('Error fetching access token:', err));
});

app.listen(process.env.PORT || 5000);