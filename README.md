# Cors package with Typescript types

### Install

```
npm install cors-ts
```

or

```
yarn add cors-ts
```

### Usage

(see [Cors](https://www.npmjs.com/package/cors) Documentation for more information)

##### CommonJS

```js
//@ts-check
const express = require('express')
const { cors } = require('cors-ts')

const app = express()
const PORT = process.env.PORT || 4000

//Parameters are Optional
app.use(
  cors({
    origin: '*',
    credentials: true,
  })
)

app.listen(PORT, function () {
  console.log(`CORS-enabled web server listening on port ${PORT}`)
})
```

##### ES6

```ts
//@ts-check
import express from 'express'
import cors from 'cors-ts'

const app = express()
const PORT = process.env.PORT || 4000

//Parameters are Optional
app.use(
  cors({
    origin: 'http://example.com',
    optionsSuccessStatus: 200,
  })
)

app.listen(PORT, function () {
  console.log(`CORS-enabled web server listening on port ${PORT}`)
})
```

### Credits

Troy Goode ([Original Package](https://www.npmjs.com/package/cors)
Creator)
