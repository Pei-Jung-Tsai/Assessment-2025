import { reactive } from 'vue'
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth'
import db from '../firebase/init'
import { doc, getDoc } from 'firebase/firestore'

// global shared state object
export const authState = reactive({
  isReady: false, // initial auth sync is complete
  isAuthed: false, // login status
  uid: null,
  email: null,
  role: null, //user or admin
  profile: null, // Firestore /users/{uid} whole document
})

// while, login or logout ,run automatically
export function initAuth() {
  const auth = getAuth()
  onAuthStateChanged(auth, async (User) => {
    // if no login, reset
    if (!User) {
      Object.assign(authState, {
        isReady: true,
        isAuthed: false,
        uid: null,
        email: null,
        role: null,
        profile: null,
      })
      return
    }
    // if login, fetch the user document from Firestore to get role.
    let data = {}
    try {
      const snap = await getDoc(doc(db, 'users', User.uid))
      data = snap.exists() ? snap.data() : {}
    } catch (error) {
      console.error('[initAuth] getDoc failed:', error)
    }

    // save in global shared state object
    Object.assign(authState, {
      isReady: true,
      isAuthed: true,
      uid: User.uid,
      email: User.email,
      role: data.role || 'user',
      profile: data,
    })
  })
}

export async function doSignOut() {
  await signOut(getAuth())
}
