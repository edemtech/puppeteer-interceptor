const express = require('express');
const app = express();
const puppeteer = require('puppeteer');
const useragent = require('useragent');
const path = require('path');


function isBot(userAgent) {
  const agent = useragent.is(userAgent);
  return !agent.webkit && !agent.opera && !agent.ie &&
    !agent.chrome && !agent.safari && !agent.mobile_safari &&
    !agent.firefox && !agent.mozilla && !agent.android;
}

app.use(express.static(path.join(__dirname, 'server/app')));
if (app.get('env') === 'development') {
  app.locals.pretty = true;
}

const port = 8080;
const portServer = 3000;
app.get('*', async (req, res) => {
  if (!isBot(req.headers['user-agent'])) {
    res.sendFile(__dirname + '/server/app/index.html'); // this is a human, send the HTML right away
  } else {
    try {
      const browser = await puppeteer.launch({ headless: true });
      const page = await browser.newPage();

      // we need to override the headless Chrome user agent since its default one is still considered as "bot"
      await page.setUserAgent('Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2228.0 Safari/537.36');

      const localUrl = 'http://localhost:' + portServer + req.originalUrl;
      await page.goto(localUrl, {
        waitUntil: 'networkidle0',
      });

      const html = await page.evaluate(() => {
        return document.documentElement.innerHTML;
      });

      res.send(html);

    } catch (e) {
      console.log(e);
      res.send("ERROR");
    }
  }
});

app.listen(port, () => {
  console.log(`Serving at port ${port}`);
});