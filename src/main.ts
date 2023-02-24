// Components
import App from './App.vue'
import 'vuetify/styles'
import '@/style.css'

// Composables
import { createApp } from 'vue'
import { createVuetify } from 'vuetify'

const vuetify = createVuetify({
  theme: {
    themes: {
      light: {
        colors: {
          primary: '#1867C0',
          secondary: '#5CBBF6',
        },
      },
    },
  },
})

const app = createApp(App)

app.use(vuetify).mount('#app')
