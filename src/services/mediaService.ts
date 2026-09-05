import { openDB } from 'idb'

export async function getDB(){
  return openDB('chatvault', 1, {upgrade(db){
    db.createObjectStore('sessions', {keyPath:'sessionId'})
  }})
}
