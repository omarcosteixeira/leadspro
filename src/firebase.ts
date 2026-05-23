import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfigMain from '../firebase-applet-config.json';

const firebaseConfigFdv = {
  apiKey: "AIzaSyBexxjzDAuNSgY90rlVqpz4AQZDE-QwSG4",
  authDomain: "gestaodeleadspro-d4230.firebaseapp.com",
  projectId: "gestaodeleadspro-d4230",
  storageBucket: "gestaodeleadspro-d4230.firebasestorage.app",
  messagingSenderId: "964003766645",
  appId: "1:964003766645:web:cc9b8f7ab92bda8b44333c"
};

const appMain = initializeApp(firebaseConfigMain, "MAIN");
const authMain = getAuth(appMain);
const dbMain = getFirestore(appMain, firebaseConfigMain.firestoreDatabaseId);

const appFdv = initializeApp(firebaseConfigFdv, "FDV");
const authFdv = getAuth(appFdv);
const dbFdv = getFirestore(appFdv);

// Secondary apps
const secondaryAppMain = initializeApp(firebaseConfigMain, 'secondary');
const secondaryAuthMain = getAuth(secondaryAppMain);

const secondaryAppFdv = initializeApp(firebaseConfigFdv, 'secondaryFdv');
const secondaryAuthFdv = getAuth(secondaryAppFdv);

export let currentEnv = localStorage.getItem('userEnv') as 'main' | 'fdv' || 'main';

export const switchEnv = (env: 'main' | 'fdv') => {
  localStorage.setItem('userEnv', env);
  window.location.reload();
};

export const auth = currentEnv === 'fdv' ? authFdv : authMain;
export const db = currentEnv === 'fdv' ? dbFdv : dbMain;
export const secondaryAuth = currentEnv === 'fdv' ? secondaryAuthFdv : secondaryAuthMain;

// Caminhos das coleções
const appId = firebaseConfigMain.projectId;
export let currentRole = '';

export const setRoleContext = (role: string | undefined) => {
  currentRole = role || '';
};

const basePaths = {
  LEADS: 'leads',
  USERS: 'users',
  GAP: 'gap_academico',
  PLANNER: 'planner',
  BASES: 'bases',
  LINKS: 'linksUteis',
  FIES_PROUNI: 'fies_prouni',
  CAMPANHAS: 'campanhas',
  BOM_DIA: 'bom_dia',
  FORECAST: 'forecast',
  PERIODO_CAPTACAO: 'periodo_captacao',
  CALENDARIO_ACOES: 'calendario_acoes',
  EMPRESAS_PARCEIRAS: 'empresas_parceiras',
  WHATSAPP_MESSAGES: 'whatsapp_messages',
  MAPAO_ACADEMICO: 'mapao_academico',
  BASES_DISPARO: 'bases_disparo',
  BASES_RENOVACAO: 'bases_renovacao',
  BOT_CONFIG: 'bot_config',
};

export const COLLECTIONS = new Proxy(basePaths, {
  get(target, prop: keyof typeof basePaths) {
    if (currentEnv === 'fdv') {
      return target[prop]; // Root path for standalone Firebase
    } else {
      return `artifacts/${appId}/public/data/${target[prop]}`;
    }
  }
}) as { [K in keyof typeof basePaths]: string };

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
