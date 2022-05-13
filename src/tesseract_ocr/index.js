// import { createWorker } from 'tesseract.js'
// const { createWorker } = require('tesseract.js')
import './index.scss'

const workerPath = './lib/tesseract.js/worker.min.js'
const langPath = './lib/tesseract.js-lang'
const corePath = './lib/tesseract.js-core/tesseract-core.wasm.js'
const workPromise = (async function initWork() {
  const { createWorker } = Tesseract
  const worker = createWorker({
    workerPath,
    langPath,
    corePath,
    logger: m => {
      worker._onmessage && worker._onmessage(m)
    },
  })
  await worker.load()
  await worker.loadLanguage('chi_sim')
  await worker.initialize('chi_sim')
  return worker
})()
class LoadingTip {
  constructor() {
    this.$target = document.querySelector('#status')
    this.$progress = this.$target.querySelector('.progress')
  }
  show(progress) {
    this.$target.classList.add('show')
    this.$progress.innerText = progress
  }
  hide() {
    this.$target.classList.remove('show')
  }
}

const $result = document.querySelector('#result')
const $input = document.querySelector('#file')
const $btn = document.querySelector('#upload')
const $dragArea = document.querySelector('#drag-area')

const tip = new LoadingTip()



$input.addEventListener('change', function(e) {
  const imgFile = e.target.files[0]
  if (!imgFile) {
    return
  }
  startOcr(imgFile)
})
/* 触发文件选择 */
$btn.addEventListener('click', function(e) {
  e.preventDefault()
  $input.value = ''
  $input.click()
})
/* 拖拽 */
$dragArea.addEventListener('dragenter', preventDragDefault)
$dragArea.addEventListener('dragover', preventDragDefault)
$dragArea.addEventListener('drop', function (e) {
  preventDragDefault(e)
  const files = e.dataTransfer.files
  if (files[0]) {
    startOcr(files[0])
  }
})
/* 粘贴 */
$dragArea.addEventListener('paste', function (e) {
  preventDragDefault(e)
  const files = e.clipboardData.files
  if (files[0]) {
    startOcr(files[0])
  }
})

// 监听tinymce的消息
window.addEventListener('message', function (event) {
  if (event.data !== 'save') return
  window.parent.postMessage({
    mceAction: 'insertContent',
    content: $result.value || ''
  }, '*')
  window.parent.postMessage({
      mceAction: 'close'
  }, '*')
})

/**
 * 识别图片
 * @param {File} imgFile 文件
 */
function startOcr(imgFile) {
  const isImg = /^image\//.test(imgFile.type)
  if (!isImg) {
    return
  }
  tip.show('0%')
  workPromise.then(async worker => {
    worker._onmessage = function(m) {
      // '打印消息'
      if (m.status === 'recognizing text') {
        const progress = (m.progress * 100).toFixed(2) + '%'
        tip.show(progress)
      }
    }
    const { data: { text } } = await worker.recognize(imgFile)
    $result.value = text.replace(/\s/g, '')
    tip.hide()
  })
}
function preventDragDefault(e) {
  e.preventDefault()
  e.stopPropagation()
}

