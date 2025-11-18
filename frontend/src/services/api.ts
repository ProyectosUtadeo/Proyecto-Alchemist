// src/services/api.ts


export interface Alchemist {
  id: number;
  name: string;
  specialty: string;
  rank: string;
  age?: number;
  email?: string | null;
  created_at?: string;
}

export interface Mission {
  id: number;
  title: string;
  description: string;
  assigned_to: number | null;
  status: string;
  created_at?: string;
}

export interface Material {
  id: number;
  name: string;
  unit: string;
  cost: number;
  stock: number;
  created_at?: string;
}

export interface Transmutation {
  id: number;
  alchemist_id: number;
  description: string;
  status: string;
  created_at?: string;
  alchemist?: Alchemist;
  estimated_cost?: number;
  estimated_duration_seconds?: number;
}

export interface TransmutationMaterialInput {
  materialId: number;
  quantity: number;
}

export interface TransmutationSimulationRequest {
  description: string;
  complexity?: string;
  riskLevel?: string;
  catalystQuality?: number;
  materials?: TransmutationMaterialInput[];
}

export interface TransmutationSimulationResponse {
  complexity: string;
  risk_level: string;
  catalyst_quality: number;
  base_material_cost: number;
  arcane_energy_cost: number;
  complexity_weight: number;
  risk_multiplier: number;
  catalyst_modifier: number;
  estimated_cost: number;
  duration_seconds: number;
  materials_breakdown: Array<{
    material_id: number;
    name: string;
    quantity: number;
    unit_cost: number;
    subtotal: number;
  }>;
}

export interface Audit {
  id: number;
  action: string;
  entity: string;
  entity_id: number;
  created_at?: string;
}



const BASE = "http://localhost:8000";


function getToken() {
  return localStorage.getItem("jwt") || "";
}

async function http<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
    },
  });


  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }


  try {
    return (await res.json()) as T;
  } catch {
    return {} as T;
  }
}



export interface AuthResponse {
  token: string;
}

export function login(email: string, password: string) {
  return http<AuthResponse>(`${BASE}/auth/login`, {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function register(email: string, password: string, role: "ALCHEMIST" | "SUPERVISOR", alchemist_id?: number) {
  return http<AuthResponse>(`${BASE}/auth/register`, {
    method: "POST",
    body: JSON.stringify({ email, password, role, alchemist_id }),
  });
}



export const getAlchemists = () => http<Alchemist[]>(`${BASE}/alchemists`);

export const createAlchemist = (data: Partial<Omit<Alchemist, "id" | "created_at">>) => {
  const sanitized = {
    ...data,
    email: data.email && data.email.trim() !== "" ? data.email : null,
    age: data.age ?? 0,
  };
  return http<Alchemist>(`${BASE}/alchemists`, {
    method: "POST",
    body: JSON.stringify(sanitized),
  });
};

export const updateAlchemist = (id: number, data: Partial<Omit<Alchemist, "id">>) => {
  const sanitized = {
    ...data,
    email: data.email && data.email.trim() !== "" ? data.email : null,
    age: data.age ?? 0,
  };
  return http<Alchemist>(`${BASE}/alchemists/${id}`, {
    method: "PUT",
    body: JSON.stringify(sanitized),
  });
};

export const deleteAlchemist = (id: number) =>
  fetch(`${BASE}/alchemists/${id}`, {
    method: "DELETE",
    headers: {
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
    },
  }).then(() => undefined);



export const getMaterials = () => http<Material[]>(`${BASE}/materials`);

export const createMaterial = (data: Omit<Material, "id" | "created_at">) =>
  http<Material>(`${BASE}/materials`, {
    method: "POST",
    body: JSON.stringify(data),
  });

export const updateMaterial = (id: number, data: Partial<Material>) =>
  http<Material>(`${BASE}/materials/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

export const deleteMaterial = (id: number) =>
  fetch(`${BASE}/materials/${id}`, {
    method: "DELETE",
    headers: {
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
    },
  }).then(() => undefined);


//  Missions


export const getMissions = () => http<Mission[]>(`${BASE}/missions`);

export const createMission = (data: Omit<Mission, "id" | "created_at" | "status">) =>
  http<Mission>(`${BASE}/missions`, {
    method: "POST",
    body: JSON.stringify(data),
  });

export const updateMission = (id: number, data: Partial<Mission>) =>
  http<Mission>(`${BASE}/missions/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

export const deleteMission = (id: number) =>
  fetch(`${BASE}/missions/${id}`, {
    method: "DELETE",
    headers: {
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
    },
  }).then(() => undefined);


//  Transmutations


export const getTransmutations = () => http<Transmutation[]>(`${BASE}/transmutations`);

// ⚠️ Importante: el backend espera POST /transmutations/:alchemistId
export interface StartTransmutationPayload extends TransmutationSimulationRequest {}

export const startTransmutation = (
  alchemistId: number,
  payload: StartTransmutationPayload,
) =>
  http<Transmutation>(`${BASE}/transmutations/${alchemistId}`, {
    method: "POST",
    body: JSON.stringify({
      description: payload.description,
      alchemist_id: alchemistId,
      complexity: payload.complexity,
      risk_level: payload.riskLevel,
      catalyst_quality: payload.catalystQuality,
      materials: payload.materials?.map(m => ({
        material_id: m.materialId,
        quantity: m.quantity,
      })),
    }),
  });

export const simulateTransmutation = (payload: TransmutationSimulationRequest) =>
  http<TransmutationSimulationResponse>(`${BASE}/transmutations/simulate`, {
    method: "POST",
    body: JSON.stringify({
      description: payload.description,
      complexity: payload.complexity,
      risk_level: payload.riskLevel,
      catalyst_quality: payload.catalystQuality,
      materials: payload.materials?.map(m => ({
        material_id: m.materialId,
        quantity: m.quantity,
      })),
    }),
  });

export const getTransmutation = (id: number) =>
  http<Transmutation>(`${BASE}/transmutations/${id}`);

export const updateTransmutationStatus = (id: number, status: string) =>
  http<Transmutation>(`${BASE}/transmutations/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });

export const cancelTransmutation = (id: number) =>
  http<Transmutation>(`${BASE}/transmutations/${id}`, { method: "DELETE" });


//  Audits


export const getAudits = () => http<Audit[]>(`${BASE}/audits`);