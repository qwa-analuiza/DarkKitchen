import { Injectable } from '@angular/core';
import {
  Auth,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut
} from '@angular/fire/auth';

import {
  Firestore,
  collection,
  collectionData,
  doc,
  getDoc,
  query,
  setDoc,
  where
} from '@angular/fire/firestore';

import { catchError, Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  constructor(
    private firestore: Firestore,
    private auth: Auth
  ) {}

  login(email: string, password: string) {
    return signInWithEmailAndPassword(this.auth, email, password);
  }

  register(email: string, password: string) {
    return createUserWithEmailAndPassword(this.auth, email, password);
  }

  logout() {
    return signOut(this.auth);
  }

  resetPassword(email: string) {
    return sendPasswordResetEmail(this.auth, email);
  }

  getCurrentUser() {
    return this.auth.currentUser;
  }

  // 🍔 PRODUTOS (FIRESTORE)
  getProducts() {
    const ref = collection(this.firestore, 'products');
    return collectionData(ref, { idField: 'id' });
  }

  // 👤 PERFIL DO USUÁRIO
  async salvarPerfilUsuario(uid: string, dados: any) {
    const userDocRef = doc(this.firestore, `usuarios/${uid}`);
    return setDoc(userDocRef, dados, { merge: true });
  }

  async buscarPerfilUsuario(uid: string) {
    const userDocRef = doc(this.firestore, `usuarios/${uid}`);
    const docSnap = await getDoc(userDocRef);
    return docSnap.exists() ? docSnap.data() : null;
  }

  // 📜 BUSCAR PEDIDOS DO USUÁRIO LOGADO
  buscarPedidosUsuario(uid: string): Observable<any[]> {
    console.log('📡 [FirebaseService] Iniciando busca de pedidos para UID:', uid);
    const ref = collection(this.firestore, 'pedidos');
    
    // Simplificamos a query removendo o orderBy temporariamente
    // Isso evita erros de "Index missing" que fazem a query retornar vazio silenciosamente
    const q = query(ref, where('uidUsuario', '==', uid));

    return (collectionData(q, { idField: 'id' }) as Observable<any[]>).pipe(
      catchError(error => {
        console.error('Erro ao buscar pedidos por UID:', error);
        return of([]);
      })
    );
  }
}
