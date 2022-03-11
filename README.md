# Howdz Deno

This is a `Deno` pratice project by [Leon.D](https://kongfandong.cn)

---

## 🚀Public API

### [/bing/daily](https://howdz.deno.dev/bing/daily)

Return daily photo from Bing.

Params: (`w`: number, `h`: number, `type`: 'redirect' | 'json')

---

### [/bing/list](https://howdz.deno.dev/bing/list)

Return recent half month Bing daily photo list for json type. 

---

### [/unsplash/random](https://howdz.deno.dev/unsplash/random)

Return random photo from Unsplash.

Params: (`w`: number, `h`: number, `type`: 'redirect' | 'json', `keyword`: string)

---

### [/unsplash/list](https://howdz.deno.dev/unsplash/list)

Return Unsplash list from daily cache for json type.

---

### [/movieLines](https://howdz.deno.dev/movieLines)
Return random movie lines for a json type.

---

## 🔨Development

Download `Deno` Client, and add System Path.

```
deno run --allow-net main.ts
```

Then visit https://localhost:8888

This project just run in single file, so you can deploy it in [Deno Deploy](https://deno.com/deploy) easily.
