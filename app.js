const express = require('express');
const app = express();
const path = require('path');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const axios = require('axios');
const FB = require('fb');
const schedule = require('node-schedule');

const urI = process.env.mongodbURI;

const transporter = nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    port: 465,
    secure: true,
    auth: {
        user: "devriousteam@gmail.com",
        pass: "xsmtpsib-59d53fdf227388f930c459c42860c2db0473309c91d978c2a4ac189f2f48db0b-hmgY8wO5IQ3H7ABR",
    },
});

function extractHashtags(text) {
    if (!text) {
        return [];
    }

    const result = text.replace(/@\w+/g, '');

    return result || [];
};

const uploadVideo = async (accessToken, videoData, description, pageID, videoID) => {
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
            } else {
                const livkID = new Link({
                    link: videoID,
                    caption: description,
                    page_id: pageID
                });
                livkID.save();
            }
        }
    );
};

async function vList(user1, pid) {
    let videoListf = [];
    let cursor = '0';
    while (cursor !== "noMore") {
        let options = {
            method: 'GET',
            url: 'https://tiktok-video-feature-summary.p.rapidapi.com/user/posts',
            params: {
                unique_id: user1,
                count: '30',
                cursor: cursor
            },
            headers: {
                'X-RapidAPI-Key': 'f34902baffmsh4d26ee5486241d5p188ddfjsnf62ba6a713ab',
                'X-RapidAPI-Host': 'tiktok-video-feature-summary.p.rapidapi.com'
            }
        };
        const response = await axios.request(options);

        if (response.data.data.videos) {
            response.data.data.videos.forEach(video => {
                Link.findOne({ link: video.video_id, page_id: pid }).then(result => {
                    if (!result) {
                        videoListf.push(video);
                    }
                });
            });
        }
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
    },
    page_id: {
        type: String,
        required: true
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
    token: {
        type: String,
        required: true
    },
    tdate: {
        type: Date,
        required: true
    }
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

    if (req.body.pass != 'dev@tik@scraper@45') {
        return res.send('Wrong Password!');
    }

    Token.findOne({ page: pagename }).then(result => {
        result.token = token;
        result.tdate = new Date();
        result.save();
    });

    res.send('SUCCESS');
    res.end();
});

app.post('/pageadd', async function (req, res) {
    const pagename = req.body.pagename;
    const pageid = req.body.pageid;
    const token = req.body.token;

    if (req.body.pass != 'dev@tik@scraper@45') {
        return res.send('Wrong Password!');
    }

    const pageToken = new Token({
        page: pagename,
        pageid: pageid,
        token: token,
        tdate: new Date()
    });
    await pageToken.save();

    res.send('SUCCESS');
    res.end();
});

app.post('/deletepage', async function (req, res) {
    const pagename = req.body.page;

    if (req.body.pass != 'dev@tik@scraper@45') {
        return res.send('Wrong Password!');
    }

    await Token.findByIdAndDelete(pagename);

    res.send('SUCCESS');
    res.end();
});

app.post('/add', async function (req, res) {
    const usernamesS = req.body.usernames || "";
    const pageName = req.body.atoken;
    if (req.body.pass != "dev@tik@scraper@45") {
        return res.send('Wrong Password!');
    }
    const aToken = await Token.findOne({ page: pageName });
    let access_token = aToken.token;
    const users = usernamesS.split(" ");

    res.send('SUCCESS');
    res.end();

    let begin = new Date();
    for (let user of users) {
        begin = new Date(begin.getTime() + 3000);
        schedule.scheduleJob(begin, async function () {
            await vList(user, aToken.pageid).then((videoList) => {
                try {
                    let ind = 0;
                    let start = new Date();
                    for (let video of videoList) {
                        const time1 = Math.floor(Math.random() * (300000 - 240000 + 1)) + 240000;
                        start = new Date(start.getTime() + time1);
                        schedule.scheduleJob(start, async function () {
                            try {
                                const hashtagsList = await extractHashtags(video.title);
                                await uploadVideo(access_token, video.play, hashtagsList, aToken.pageid, video.video_id);
                                ++ind;
                                if (ind === (videoList.length - 1)) {
                                    const mailOptions = {
                                        from: {
                                            name: "Notification",
                                            address: "info@devriousteam.lk"
                                        },
                                        to: process.env.mail,
                                        subject: 'Uploading is done!',
                                        text: `Uploading to ${aToken.page} is done and ${videoList.length} videos uploaded.`
                                    };
                                    transporter.sendMail(mailOptions, function (err) {
                                        if (err) {
                                            console.log(err);
                                        };
                                    });
                                }
                            } catch (error) {
                                console.error(error);
                            }
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

app.get('/pagedelete', function (req, res) {
    Token.find().then((result) => {
        const pageArray = result.map(pageResult => { return pageResult });
        res.render('delete', { pages: pageArray });
    });
});

app.get('/pages', function (req, res) {
    res.render('pages');
});

app.get('/', async function (req, res) {
    await Token.find().then((result1) => {
        result1.forEach(page => {
            const currentDate = new Date();
            const givenDate = page.tdate;
            const timeDifference = currentDate.getTime() - givenDate.getTime();
            const differenceInDays = timeDifference / (1000 * 3600 * 24);
            if (differenceInDays > 29) {
                Token.findById(page.id).then(pres => {
                    pres.page = pres.page + " (Expired!)";
                    pres.save();
                });
            }
        });
    });
    const pageArray = result.map(pageResult => { return pageResult });
    return res.render('usernames', { pages: pageArray });
});

app.listen(process.env.PORT || 3000);
//dev@tik@scraper@45