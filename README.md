# Howdz Deno

This is a `Deno` pratice project by [Leon.D](https://kongfandong.cn)

---

## 🚀Public API

**Movie**

+ **[/movieLines](https://howdz.deno.dev/movieLines)** - Return random movie lines for json type.
+ **[/movieLinesList](https://howdz.deno.dev/movieLinesList)** - Return movie lines cache list for json type.

---

**Photo**

+ **[/bing/daily](https://howdz.deno.dev/bing/daily)** - Return daily photo from Bing.

  *Params: (\`w\`: number, \`h\`: number, \`type\`: 'redirect' | 'json')*

+ **[/bing/list](https://howdz.deno.dev/bing/list)** - Return recent half month Bing daily photo list for json type. 

+ **[/unsplash/random](https://howdz.deno.dev/unsplash/random)** - Return random photo from Unsplash.

  *Params: (\`w\`: number, \`h\`: number, \`type\`: 'redirect' | 'json', \`keyword\`: string)*

+ **[/unsplash/list](https://howdz.deno.dev/unsplash/list)** - Return Unsplash list from daily cache for json type.

+ **[/sina/random](https://howdz.deno.dev/sina/random)** - Return random photo from sina (transfer).

---

**HotList**

+ **[/hotList/zhihu](https://howdz.deno.dev/hotList/zhihu)** - Return Zhihu hot list
+ **[/hotList/weibo](https://howdz.deno.dev/hotList/weibo)** - Return Weibo hot list
+ **[/hotList/juejin](https://howdz.deno.dev/hotList/juejin)** - Return Juejin hot list

---

## 🔨Development

Download `Deno` Client, and add System Path.

```
deno run --allow-net main.ts
```

Then visit https://localhost:8888

This project just run in single file, so you can deploy it in [Deno Deploy](https://deno.com/deploy) easily.
