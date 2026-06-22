import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, getFirestore } from 'firebase/firestore';
import firebaseConfigPrincipal from '../firebase-applet-config.json';

export { firebaseConfigPrincipal };

export const firebaseConfigComercial = {
  apiKey: "AIzaSyBexxjzDAuNSgY90rlVqpz4AQZDE-QwSG4",
  authDomain: "gestaodeleadspro-d4230.firebaseapp.com",
  projectId: "gestaodeleadspro-d4230",
  storageBucket: "gestaodeleadspro-d4230.firebasestorage.app",
  messagingSenderId: "964003766645",
  appId: "1:964003766645:web:75aea7b1a825ddfe44333c"
};

const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
const urlServidor = params ? params.get('servidor') : null;
const savedServidor = urlServidor || localStorage.getItem('servidor_selected') || 'principal';
const activeConfig = savedServidor === 'comercial' ? firebaseConfigComercial : firebaseConfigPrincipal;

const app = initializeApp(activeConfig);
export const auth = getAuth(app);

// Enable robust native offline persistence for Android and PWA standalone apps
export const db = typeof window !== 'undefined'
  ? initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
      })
    }, (activeConfig as any).firestoreDatabaseId || undefined)
  : getFirestore(app, (activeConfig as any).firestoreDatabaseId || undefined);

// Secondary app for creating users without signing out the current admin
export const secondaryApp = getApps().length > 1 
  ? getApp('secondary') 
  : initializeApp(activeConfig, 'secondary');
export const secondaryAuth = getAuth(secondaryApp);

// Caminhos das coleções
const appId = activeConfig.projectId;
export const COLLECTIONS = {
  LEADS: `artifacts/${appId}/public/data/leads`,
  USERS: `artifacts/${appId}/public/data/users`,
  GAP: `artifacts/${appId}/public/data/gap_academico`,
  PLANNER: `artifacts/${appId}/public/data/planner`,
  BASES: `artifacts/${appId}/public/data/bases`,
  LINKS: `artifacts/${appId}/public/data/linksUteis`,
  FIES_PROUNI: `artifacts/${appId}/public/data/fies_prouni`,
  CAMPANHAS: `artifacts/${appId}/public/data/campanhas`,
  BOM_DIA: `artifacts/${appId}/public/data/bom_dia`,
  FORECAST: `artifacts/${appId}/public/data/forecast`,
  PERIODO_CAPTACAO: `artifacts/${appId}/public/data/periodo_captacao`,
  CALENDARIO_ACOES: `artifacts/${appId}/public/data/calendario_acoes`,
  EMPRESAS_PARCEIRAS: `artifacts/${appId}/public/data/empresas_parceiras`,
  WHATSAPP_MESSAGES: `artifacts/${appId}/public/data/whatsapp_messages`,
  MAPAO_ACADEMICO: `artifacts/${appId}/public/data/mapao_academico`,
  BASES_DISPARO: `artifacts/${appId}/public/data/bases_disparo`,
  BASES_RENOVACAO: `artifacts/${appId}/public/data/bases_renovacao`,
  BOT_CONFIG: `artifacts/${appId}/public/data/bot_config`,
  META_DIA: `artifacts/${appId}/public/data/meta_dia`,
  SOLICITACAO_FOLGA: `artifacts/${appId}/public/data/solicitacoes_folga`,
  CURSOS: `artifacts/${appId}/public/data/cursos`,
  INSUMOS_PEDIDOS: `artifacts/${appId}/public/data/insumos_pedidos`,
  INSUMOS_ESTOQUE: `artifacts/${appId}/public/data/insumos_estoque`,
  INSUMOS_PEDIDOS_COMERCIAL: `artifacts/${appId}/public/data/insumos_pedidos_comercial`,
  INSUMOS_ESTOQUE_COMERCIAL: `artifacts/${appId}/public/data/insumos_estoque_comercial`,
  INSUMOS_BAIXAS: `artifacts/${appId}/public/data/insumos_baixas`,
  INSUMOS_BAIXAS_COMERCIAL: `artifacts/${appId}/public/data/insumos_baixas_comercial`,
  FUNCIONARIOS: `artifacts/${appId}/public/data/funcionarios`,
};

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string;
    email?: string | null;
    emailVerified?: boolean;
    isAnonymous?: boolean;
    tenantId?: string | null;
    providerInfo?: any[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  const errInfo: FirestoreErrorInfo = {
    error: errorMessage,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };

  // Safe to ignore: occurs when unmounting/unsubscribing cancels in-flight requests
  if (errorMessage.includes('The user aborted a request') || errorMessage.includes('cancelled')) {
    console.debug('Firestore: Request aborted (likely unmount/unsub)', errInfo.path);
    return errInfo;
  }

  console.error('Firestore Error: ', JSON.stringify(errInfo));
  // We don't necessarily want to crash the whole app, but we want to log it
  return errInfo;
}
