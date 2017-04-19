const fs = require("fs")
const express = require('express')
const app = express()
const sass = require('node-sass')
const exec = require('child_process').exec

app.use(express.static('src'))

const srcFolder = `${__dirname}/src`

const outFile = `${srcFolder}/css/style.css`
const sassResult = sass.renderSync({
  file: `${srcFolder}/css/style.scss`,
  outFile,
  outputStyle: 'compressed',
  sourceMap: true
})
fs.writeFileSync(outFile, sassResult.css)

exec(`jsx --extension jsx src/jsx src/js`, (error, stdout, stderr) => null)

app.listen(8085, () => console.log('Listening on port 8085!'))