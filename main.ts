import { Application, Router, helpers } from "https://deno.land/x/oak/mod.ts"
// import { Marked } from "https://deno.land/x/markdown@v2.0.0/mod.ts";
import { Marked } from 'https://raw.githubusercontent.com/ubersl0th/markdown/master/mod.ts'
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

**Movie**

+ **[/movieLines](/movieLines)** - Return random movie lines for json type.
+ **[/movieLinesList](/movieLinesList)** - Return movie lines cache list for json type.

---

**Photo**

+ **[/bing/daily](/bing/daily)** - Return daily photo from Bing.

  *Params: (\`w\`: number, \`h\`: number, \`type\`: 'redirect' | 'json')*

+ **[/bing/list](/bing/list)** - Return recent half month Bing daily photo list for json type. 

+ **[/unsplash/random](/unsplash/random)** - Return random photo from Unsplash.

  *Params: (\`w\`: number, \`h\`: number, \`type\`: 'redirect' | 'json', \`keyword\`: string)*

+ **[/unsplash/list](/unsplash/list)** - Return Unsplash list from daily cache for json type.

+ **[/sina/random](/sina/random)** - Return random photo from sina (transfer).

---

**HotList**

+ **[/hotList/zhihu](/hotList/zhihu)** - Return Zhihu hot list
+ **[/hotList/weibo](/hotList/weibo)** - Return Weibo hot list
+ **[/hotList/juejin](/hotList/juejin)** - Return Juejin hot list

---

`
  const html = `<title>Howdz Deno</title><link rel="stylesheet" href="https://unpkg.com/water.css@2.1.1/out/water.css" /><body>${Marked.parse(md).content}</body>`
  ctx.response.body = html
  ctx.response.type = 'html'
})

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

// Start: === Bing Photo ===
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
    const mirror = url.replace('images.unsplash.com', 'dogefs.s3.ladydaily.com/~/source/unsplash')
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

// Start: === Random sina photo ===
router.get('/sina/random', async ctx => {
  const { type = 'redirect' } = getQuery(ctx)
  const target = 'https://api.ixiaowai.cn/gqapi/gqapi.php?return=json'
  const res = await fetch(target)
  const data = await res.json()
  if (type === 'json') {
    ctx.response.body = data
  } else {
    ctx.response.redirect(data.imgurl)
  }
})
// End: === Random sina photo ===


// ### List Api
// Start: === Juejin List ===
const juejinCache = { time: 0, list: [] as any[] }
const getJuejinList = async () => {
  const url = `https://api.juejin.cn/recommend_api/v1/article/recommend_all_feed`
  const res = await fetch(url, {
    method: 'post',
    body: JSON.stringify({ limit: 50, client_type: 2680, cursor: '0', id_type: 2, sort_type: 200 }),
    headers: { 'Content-Type': 'application/json' }
  })
  const data = await res.json()
  const list = data.data
  juejinCache.time = +new Date()
  juejinCache.list = list.reduce((prev: any, curr: any) => {
    if (curr.item_type === 2) {
      const article = curr && curr.item_info && curr.item_info.article_info
      if (article) {
        const { article_id, title, digg_count, view_count, link_url } = article
        const result = {
          article_id,
          title,
          digg_count,
          view_count,
          link_url: link_url || `https://juejin.cn/post/${article_id}`
        }
        return [...prev, result]
      }
    }
    return prev
  }, [])
}
router.get('/hotList/juejin', async ctx => {
  if (juejinCache.list.length === 0) await getJuejinList()
  ctx.response.body = { time: juejinCache.time, list: juejinCache.list }
})
// End: === Juejin List ===

// Start: === Zhihu List ===
const zhihuCache = { time: 0, list: [] as any[] }
const getZhihuList = async () => {
  const url = 'https://kongfandong.cn/api/zhihuList'
  const res = await fetch(url)
  const { time, list } = await res.json()
  zhihuCache.time = time
  zhihuCache.list = list
}
router.get('/hotList/zhihu', async ctx => {
  if (zhihuCache.list.length === 0) await getZhihuList()
  ctx.response.body = { time: zhihuCache.time, list: zhihuCache.list }
})
// End: === Zhihu List ===

// Start: === Weibo List ===
const weiboCache = { time: 0, list: [] as any[] }
const getWeiboList = async () => {
  const url = 'https://m.weibo.cn/api/container/getIndex?containerid=106003%2526filter_type%253Drealtimehot'
  const res = await fetch(url)
  const data = await res.json()
  const list = data.data.cards[0].card_group
  weiboCache.time = +new Date()
  weiboCache.list = list.map((item: any) => {
    const { pic, desc, icon, scheme, desc_extr } = item
    return { pic, desc, icon, scheme, desc_extr }
  }).slice(0, 50)
}
router.get('/hotList/weibo', async ctx => {
  if (weiboCache.list.length === 0) await getWeiboList()
  ctx.response.body = { time: weiboCache.time, list: weiboCache.list }
})
// End:  === Weibo List ===

// Start: === Random Verse ===
router.get('/randomVerse', async ctx => {
  const res = await fetch('https://v1.jinrishici.com/all.json')
  const data = await res.json()
  ctx.response.body = data
})

cron('0 0,15,30,45 * * * *', () => {
  getJuejinList(); // refresh pre 12 hours
  getZhihuList();
  getWeiboList();
});

app.use(router.routes()).use(router.allowedMethods());

app.addEventListener("listen", ({ port, secure }) => {
  console.log(`Listening on: ${secure ? "https://" : "http://"}localhost:${port}`);
});

await app.listen({ port: 8888 });
