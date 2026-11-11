import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { vReveal } from './directives/reveal'
import './assets/styles/main.css'

const app = createApp(App)
const pinia = createPinia()

app.directive('reveal', vReveal)
app.use(pinia)
app.use(router)
app.mount('#app')
