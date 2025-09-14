import { createApp } from 'vue'
import App from './App.vue'
import 'bootstrap/dist/css/bootstrap.min.css'
import router from './router'

import { initializeApp } from 'firebase/app'

const firebaseConfig = {
  apiKey: 'AIzaSyAyeWRSPMqyE6vxoj_LKbah0MJSNzoit-A',
  authDomain: 'fit5032-week6-2d5bd.firebaseapp.com',
  projectId: 'fit5032-week6-2d5bd',
  storageBucket: 'fit5032-week6-2d5bd.firebasestorage.app',
  messagingSenderId: '103054593673',
  appId: '1:103054593673:web:81141903459b0e81fb0058',
}

initializeApp(firebaseConfig)

const app = createApp(App)
app.use(router)

app.mount('#app')
