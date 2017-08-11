ta = document.querySelector('#ghostdreamz')
ta2 = document.querySelector('#replay')
ta2.hidden = true

function isEmpty(obj) {
    return Object.keys(obj).length === 0;
}

function updateSelectionRange(ta, log) {
  const props = ['selectionStart', 'selectionEnd', 'selectionDirection']
  let prev = props.reduce((acc, v) => acc[v] = ta[v] && acc, {})
  
  return function({timeStamp, target}) {
    if (target.activeElement !== ta) return
    let options = {}
    for (let k of props) {
      if (prev[k] != ta[k]) options[k] = ta[k]
    }
     
    // TODO: check if just after a keypress in log
    if (!isEmpty(options)) log.push({
      type: 'sel',
      timeStamp,
      options: options
    })
  }
}

function updateKeypress(ta, log) {
  return function({key, timeStamp}) {
    log.push({
      type: 'press',
      options: {key},
      timeStamp
    })
  }
}

function updateKeydown(ta, log) {
  return function({key, timeStamp}) {
    control = new Set(['Backspace', 'Delete'])
    if (control.has(key)) log.push({
      type: 'down',
      options: {key},
      timeStamp
    })
  }
}

log = []
document.onselectionchange = updateSelectionRange(ta, log)
ta.onkeypress = updateKeypress(ta, log)
ta.onkeydown = updateKeydown(ta, log)


// notes
// * can insert text in value
// * can change selection attrs

function replayer(ta, log, cmdFunc, cb) {
  var start = performance.now()
  var logStart = log.length && log[0].timeStamp
  var crnt_pos = 0
  var step = function(timestamp) {
    if (!log.length) return

    var entry = log[crnt_pos]
    if ( (timestamp - start) > (entry.timeStamp - logStart) ) {
      cmdFunc(entry)
      crnt_pos += 1
    }
    if (crnt_pos != log.length) window.requestAnimationFrame(step)
    else cb && cb()
  }
  return step
}

function formatKey(key) {
  if (key == "Enter") return "\n"
  else return key
}

textareaReplayer = function(ta) {
  return function(cmd) {
    console.log(cmd)
    switch (cmd.type) {
      case "sel":
        Object.assign(ta, cmd.options)
        break
      case "press":
        ta.value = ta.value.slice(0, ta.selectionStart) + formatKey(cmd.options.key) + ta.value.slice(ta.selectionEnd)
        break
      case "down":
        ta.value = ta.value.slice(0, ta.selectionStart - 1) + ta.value.slice(ta.selectionEnd)
        break
    }
  }
}
replayer2 = replayer

function toggleTa() {
  ta.hidden = !ta.hidden
  ta2.hidden = !ta2.hidden
}

document.querySelector('#boom').onclick = runReplay = function(cb = toggleTa) {
  ta2.value = ""
  toggleTa()
  ta2.focus()
  var cmdFunc = textareaReplayer(ta2)
  window.requestAnimationFrame(replayer2(ta2, log, cmdFunc, cb))
}
document.querySelector('#reset-me').onclick = () => {
  log.splice(0)
  ta.value = ""
}
document.querySelector('#save-me').onclick = () => {
  var json = JSON.stringify(log);
  var blob = new Blob([json], {type: "application/json"});
  var url  = URL.createObjectURL(blob);

  var a = document.querySelector('a')
  a.href = url
  a.download = "ghostkeys.json"
  a.click()
}
