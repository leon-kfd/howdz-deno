import { Application, Router, helpers } from "https://deno.land/x/oak/mod.ts"
import { Marked } from "https://deno.land/x/markdown@v2.0.0/mod.ts";
import { cron } from 'https://deno.land/x/deno_cron/cron.ts';

const { getQuery } = helpers;

const app = new Application();
const router = new Router()

app.use(async (ctx, next) => {
  ctx.response.headers.set('Access-Control-Allow-Origin', '*')
  ctx.response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Content-Length, Authorization, Accept, X-Requested-With , yourHeaderFeild')
  ctx.response.headers.set('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS')
  await next()
})

router.get('/', async ctx => {
  const md = `
# Howdz Deno

This is a \`Deno\` pratice project by [Leon.D](https://kongfandong.cn)

---

## 🚀Public API

### [/bing/daily](/bing/daily)

Return daily photo from Bing.

Params: (\`w\`: number, \`h\`: number, \`type\`: 'redirect' | 'json')

---

### [/bing/list](/bing/list)

Return recent half month Bing daily photo list for json type. 

---

### [/unsplash/random](/unsplash/random)

Return random photo from Unsplash.

Params: (\`w\`: number, \`h\`: number, \`type\`: 'redirect' | 'json', \`keyword\`: string)

---

### [/unsplash/list](/unsplash/list)

Return Unsplash list from daily cache for json type.

---

### [/movieLines](/movieLines)
Return random movie lines for a json type.

---

`
  const html = `<title>Howdz Deno</title><link rel="stylesheet" href="https://unpkg.com/water.css@2.1.1/out/water.css" /><body>${Marked.parse(md).content}</body>`
  ctx.response.body = html
  ctx.response.type = 'html'
})



// Start: === Bing Photo ===
// `/bing/daily`: Return daily photo from Bing.
router.get('/bing/daily', async ctx => {
  const { type = 'redirect', w, h } = getQuery(ctx)
  const res = await fetch('https://cn.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1')
  const jsonData = await res.json()
  if (type === 'json') {
    ctx.response.body = jsonData
    ctx.response.type = "json"
    ctx.response.status = 200
  } else {
    const { images } = jsonData
    const [todayImg] = images
    const { url: todayImgURL } = todayImg
    let target = `https://cn.bing.com`
    target += todayImgURL
    if (w) target += `&w=${w}`
    if (h) target += `&h=${h}`
    ctx.response.redirect(target)
  }
})

const bingListCache = { time: 0, list: [] as any[] }
const getBingList = async () => {
  const page1 = `https://cn.bing.com/HPImageArchive.aspx?format=js&idx=0&n=8&mkt=zh-CN`
  const res1 = await fetch(page1)
  const list1 = await res1.json()
  const page2 = `https://cn.bing.com/HPImageArchive.aspx?format=js&idx=8&n=8&mkt=zh-CN`
  const res2 = await fetch(page2)
  const list2 = await res2.json()
  const list = [...list1.images, ...list2.images].map((item: any) => {
    return {
      url: `https://cn.bing.com/${item.url}`,
      thumb: `https://cn.bing.com/${item.urlbase}_320x240.jpg&rf=LaDigue_1920x1080.jpg&pid=hp`,
      title: item.title
    }
  })
  bingListCache.time = +new Date()
  bingListCache.list = list
  console.log(`update bingListCache at ${+new Date()}`)
}
// `/bing/list`: Return recent half month Bing daily photo list for json type
router.get('/bing/list', async ctx => {
  if (bingListCache.list.length === 0) await getBingList()
  ctx.response.body = { time: bingListCache.time, list: bingListCache.list }
})
cron('0 5 0,12 * * *', () => {
  getBingList(); // refresh pre 12 hours
});
// End: === Bing Photo ===


// Start: === Unsplash Photo ===
router.get('/unsplash/random', async ctx => {
  const { type = 'redirect', w, h, keyword } = getQuery(ctx)
  let target = `https://source.unsplash.com/random/`
  if (w && h) target += `${w}x${h}/`
  if (keyword) target += `?${keyword}`
  if (type === 'redirect') {
    ctx.response.redirect(target)
  } else {
    const res = await fetch(target, { method: 'HEAD' })
    const url = res.url
    const mirror = url.replace('images.unsplash.com', 'rmt.ladydaily.com/fetch/~/source/unsplash')
    if (type === 'json') {
      ctx.response.body = { url, mirror }
    } else if (type === 'mirror') {
      ctx.response.redirect(mirror)
    } else {
      ctx.response.redirect(target)
    }
  }
})
const unsplashListCache = { time: 0, list: [] as any[] }
const getUnsplashList = async () => {
  const target = `https://kongfandong.cn/api/photos?pageSize=18`
  const res = await fetch(target)
  const json = await res.json()
  const list = json.data.list.map((item: any) => {
    return {
      url: item.urls.raw,
      thumb: item.urls.thumb,
      title: item.description
    }
  })
  unsplashListCache.time = +new Date()
  unsplashListCache.list = list
  console.log(`update unsplashListCache at ${+new Date()}`)
}
router.get('/unsplash/list', async ctx => {
  if (unsplashListCache.list.length === 0) await getUnsplashList()
  ctx.response.body = { time: unsplashListCache.time, list: unsplashListCache.list }
})
cron('0 5 0,12 * * *', () => {
  getUnsplashList(); // refresh pre 12 hours
})
// End: === Unsplash Photo ===


// Start: === Movie Lines ===
const movieLinesCache = { time: 0, list: [] as any[] }
const getMovieLines = async () => {
  const target = 'https://kongfandong.cn/api/movieLinesList'
  const res = await fetch(target)
  const { time: _time, list: _list } = await res.json()
  movieLinesCache.time = _time
  movieLinesCache.list = _list
  console.log(`update movieLineCache at ${+new Date()}`)
}
router.get('/movieLines', async ctx => {
  if (movieLinesCache.list.length === 0) await getMovieLines()
  const randomIndex = ~~(Math.random() * movieLinesCache.list.length)
  ctx.response.body = { ...movieLinesCache.list[randomIndex], cacheTime: movieLinesCache.time }
})
router.get('/movieLinesList', async ctx => {
  if (movieLinesCache.list.length === 0) await getMovieLines()
  ctx.response.body = { time: movieLinesCache.time, list: movieLinesCache.list }
})
cron('0 0,15,30,45 * * * *', () => {
  getMovieLines(); // refresh pre 15 minutes
});
// End: === Movie Lines ===


app.use(router.routes()).use(router.allowedMethods());

app.addEventListener("listen", ({ port, secure }) => {
  console.log(`Listening on: ${secure ? "https://" : "http://"}localhost:${port}`);
});

await app.listen({ port: 8888 });
