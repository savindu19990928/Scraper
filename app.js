const express = require('express');
const app = express();
const path = require('path');
const mongoose = require('mongoose');
const axios = require('axios');
const FB = require('fb');
const schedule = require('node-schedule');

const urI = process.env.mongodbURI;

function extractHashtags(text) {
    if (!text) {
        return [];
    }

    const result = text.replace(/@\w+/g, '');

    return result || [];
};

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
        }
    );
    return "Success";
};

async function vList(user1) {
    let videoListf = [];
    let cursor = '0';
    while (cursor !== "noMore") {
        let options = {
            method: 'GET',
            url: 'https://tiktok-scraper7.p.rapidapi.com/user/posts',
            params: {
                unique_id: user1,
                count: '30',
                cursor: cursor
            },
            headers: {
                'X-RapidAPI-Key': 'f34902baffmsh4d26ee5486241d5p188ddfjsnf62ba6a713ab',
                'X-RapidAPI-Host': 'tiktok-scraper7.p.rapidapi.com'
            }
        };
        const response = await axios.request(options);
        response.data.data.videos.forEach(video => {
            videoListf.push(video)
        });
        if (response.data.data.hasMore === true) {
            cursor = response.data.data.cursor;
        } else {
            cursor = "noMore";
        }
    };
    return videoListf;
};

mongoose.connect(urI);

const linkSchema = new mongoose.Schema({
    link: {
        type: String,
        required: true
    },
    caption: {
        type: String
    }
});

const tokenSchema = new mongoose.Schema({
    page: {
        type: String,
        required: true
    },
    pageid: {
        type: String,
        required: true
    },
    token: [{
        type: String,
        required: true
    }]
});

const Link = mongoose.model('link', linkSchema);
const Token = mongoose.model('token', tokenSchema);

app.set('view engine', 'ejs');
app.set('views', 'views');
app.use(express.static(path.join(__dirname, 'assets')));
app.use(express.urlencoded({
    extended: false
}));
app.use(express.json({
    limit: '5mb'
}));

app.post('/tokenchange', async function (req, res) {
    const pagename = req.body.page;
    const token = req.body.token;
    const tokenList = token.split(" ");

    if (req.body.pass != 'dev@tik@scraper@45') {
        return res.send('Wrong Password!');
    }

    Token.findOne({ page: pagename }).then(result => {
        result.token = tokenList;
        result.save();
    });

    res.send('SUCCESS');
    res.end();
});

app.post('/pageadd', async function (req, res) {
    const pagename = req.body.pagename;
    const pageid = req.body.pageid;
    const token = req.body.token;
    const tokenList = token.split(" ");

    if (req.body.pass != 'dev@tik@scraper@45') {
        return res.send('Wrong Password!');
    }

    const pageToken = new Token({
        page: pagename,
        pageid: pageid,
        token: tokenList
    });
    await pageToken.save();

    res.send('SUCCESS');
    res.end();
});

app.post('/add', async function (req, res) {
    const usernamesS = req.body.usernames || "";
    const pageName = req.body.atoken;
    if (req.body.pass != "dev@tik@scraper@45") {
        return res.send('Wrong Password!');
    }
    let reqCount = 1;
    const aToken = await Token.findOne({ page: pageName });
    let access_token = aToken.token[Math.floor(reqCount / 100)];
    const users = usernamesS.split(" ");

    res.send('SUCCESS');
    res.end();

    let begin = new Date();
    for (let user of users) {
        begin = new Date(begin.getTime() + 3000);
        schedule.scheduleJob(begin, async function () {
            await vList(user).then((videoList) => {
                try {
                    let start = new Date();
                    for (let video of videoList) {
                        start = new Date(start.getTime() + 180000);
                        schedule.scheduleJob(start, function () {
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
                                        const result = uploadVideo(access_token, response.data.video[0], hashtagsList);
                                        if (result === "Success") {
                                            ++reqCount;
                                            const livkID = new Link({
                                                link: video.video_id,
                                                caption: hashtagsList
                                            });
                                            await livkID.save();
                                        }
                                    } catch (error) {
                                        console.error(error);
                                    }
                                }
                            });
                        });

                    };
                } catch (error) {
                    console.error(error);
                }
            });
        });
    };
});

app.get('/robots.txt', (req, res) => {
    const filePath = path.join(__dirname, 'robots.txt');
    res.sendFile(filePath);
});

app.get('/token', function (req, res) {
    Token.find().then((result) => {
        const pageArray = result.map(pageResult => { return pageResult.page });
        res.render('token', { pages: pageArray });
    });
});

app.get('/pages', function (req, res) {
    res.render('pages');
});

app.get('/', function (req, res) {
    Token.find().then((result) => {
        const pageArray = result.map(pageResult => { return pageResult });
        res.render('usernames', { pages: pageArray });
    });
});

app.listen(process.env.PORT || 3000);
//dev@tik@scraper@45