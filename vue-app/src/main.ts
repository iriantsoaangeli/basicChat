import { createApp } from 'vue'
import { IonicVue } from '@ionic/vue'
import App from './App.vue'
import router from './router'

// CSS de base requis par Ionic
import '@ionic/vue/css/core.css'
import '@ionic/vue/css/normalize.css'
import '@ionic/vue/css/structure.css'
import '@ionic/vue/css/typography.css'
import '@ionic/vue/css/padding.css'
import '@ionic/vue/css/flex-utils.css'

// Mode sombre automatique d'Ionic (suit le réglage du système)
import '@ionic/vue/css/palettes/dark.system.css'

// Nos couleurs clair/sombre : importé en dernier pour avoir le dernier mot
import './styles/theme-couleurs-clair-sombre.css'

const app = createApp(App)

app.use(IonicVue)
app.use(router)

app.mount('#app')
