const fletchWorker = function() {
  const send = function(uri, config, defaults) {
    let url = uri
    if (defaults && defaults.root) {
      url = `${defaults.root}${uri}`
    }

    config.body = JSON.stringify(config.body)

    const fetchConfig = config

    if (defaults && defaults.headers) {
      fetchConfig.headers = defaults.headers
    }

    if (!fetchConfig.headers) {
      const headers = new Headers()
      headers.append('Content-Type', 'application/json')
      headers.append('Accept', 'application/json')
      fetchConfig.headers = headers
    }
    let result = {}
    return fetch(url, fetchConfig)
      .then(response => {
        if (!response.ok) {
          return response
        }
        return response
      })
      .then(response => {
        return response
          .json()
          .then(data => {
            result.data = data
            result.ok = response.ok

            let headers = {}
            response.headers.forEach((v, k) => {
              headers[k] = v
            })
            result.headers = headers
            return result
          })
          .catch(err => {
            console.log(err)
            return result
          })
      })
      .then(data => {
        return data
      })
      .catch(err => {
        console.log(err)
        return err
      })
  }

  self.addEventListener(
    'message',
    e => {
      send(e.data[0], e.data[1], e.data[2])
        .then(res => {
          self.postMessage(res)
        })
        .catch(err => {
          self.postMessage(err)
        })
    },
    false
  )
}

export const Fletch = base => {
  const defaults = {}
  if (base.root) {
    defaults.root = base.root
  }

  if (base.headers) {
    defaults.headers = base.headers
  }

  const send = async (uri, config) => {
    const workerSend = new Worker(
      URL.createObjectURL(new Blob([`(${fletchWorker})()`]))
    )

    const promise = new Promise((resolve, reject) => {
      workerSend.addEventListener(
        'message',
        evt => {
          if (!evt.data.ok) {
            reject(evt.data)
          }
          resolve(evt.data)
        },
        false
      )
    })
    workerSend.postMessage([uri, config, defaults])
    return promise
  }

  return {
    get: (uri, data = null) => {
      const config = {
        method: 'GET'
      }
      if (data) {
        const encodedParams = Object.keys(data)
          .map(key => `${key}=${encodeURIComponent(data[key])}`)
          .join('&')
        uri = `${uri}?${encodedParams}`
      }
      return send(uri, config)
    },
    post: (uri, data) => {
      const config = {
        method: 'POST',
        body: data
      }
      return send(uri, config)
    },
    put: (uri, data) => {
      const config = {
        method: 'PUT',
        body: data
      }

      return send(uri, config)
    },
    delete: (uri, data) => {
      const config = {
        method: 'DELETE',
        body: data
      }

      return send(uri, config)
    }
  }
}

const fletch = Fletch({
  root: 'https://api.github.com'
})

fletch
  .get('/users/jdcauley/repos', {
    page: 2
  })
  .then(data => {
    console.log(data)
  })
  .catch(err => {
    console.log(err)
  })
