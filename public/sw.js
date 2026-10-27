console.log('Service Worker cargado')

self.addEventListener('install', () => {
  console.log('Evento install del service worker')
})

self.addEventListener('activate', () => {
  console.log('Evento activate del service worker')
})

self.addEventListener('fetch', (evento) => {
  console.log('Evento fetch', evento.request.url)
})
