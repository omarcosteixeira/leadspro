import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Secondary app for creating users without signing out the current admin
export const secondaryApp = getApps().length > 1 
  ? getApp('secondary') 
  : initializeApp(firebaseConfig, 'secondary');
export const secondaryAuth = getAuth(secondaryApp);

// Caminhos das coleções
const appId = firebaseConfig.projectId;
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
