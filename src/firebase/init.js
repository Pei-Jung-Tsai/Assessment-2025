import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyAyeWRSPMqyE6vxoj_LKbah0MJSNzoit-A',
  authDomain: 'fit5032-week6-2d5bd.firebaseapp.com',
  projectId: 'fit5032-week6-2d5bd',
  storageBucket: 'fit5032-week6-2d5bd.firebasestorage.app',
  messagingSenderId: '103054593673',
  appId: '1:103054593673:web:81141903459b0e81fb0058',
}

initializeApp(firebaseConfig)
const db = getFirestore()
export default db
